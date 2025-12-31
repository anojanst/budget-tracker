import { get } from "http";
import { db } from "./dbConfig";
import { Expenses, LoanRepayments, Loans } from "./schema";
import { sql, and, eq, desc, lt, gte, asc, lte } from "drizzle-orm";
import { upsertSpecificBalanceHistory } from "./recalcBalanceHistoryFromDate";
import { deleteExpense } from "./expenseUtil";
import exp from "constants";

export const addLoanWithRepayments = async (
  createdBy: string,
  lender: string,
  principalAmount: number,
  interestRate: number,
  tenureMonths: number,
  repaymentFrequency: "monthly" | "bimonthly" | "weekly",
  nextDueDate: string
) => {
  try {
    const EMI = calculateEMI(principalAmount, interestRate, tenureMonths, repaymentFrequency);

    const loan = await db
      .insert(Loans)
      .values({
        createdBy,
        lender,
        principalAmount: principalAmount,
        remainingPrincipal: principalAmount,
        interestRate: interestRate.toPrecision(2),
        tenureMonths: tenureMonths,
        repaymentFrequency,
        EMI: EMI,
        nextDueDate,
        isPaidOff: false,
      })
      .returning({ id: Loans.id });

    if (!loan) {
      throw new Error("Loan creation failed");
    }

    if (!loan || loan.length === 0) {
      throw new Error("Loan creation failed");
    }

    const loanId = loan[0].id;

    let remainingPrincipal = principalAmount;
    let currentDate = new Date(nextDueDate); // ✅ First repayment on nextDueDate
    let repaymentInterval = repaymentFrequency === "bimonthly" ? 2 : repaymentFrequency === "weekly" ? 0.25 : 1;

    const repaymentQueries = [];

    for (let i = 0; i < tenureMonths; i += repaymentInterval) {
      // Calculate interest for this repayment
      const interestForThisPayment = (remainingPrincipal * (interestRate / 100)) / 12;

      // Principal component of EMI
      const principalForThisPayment = EMI - interestForThisPayment;

      // Reduce the remaining principal
      remainingPrincipal = Math.max(remainingPrincipal - principalForThisPayment, 0);

      // ✅ First repayment on `nextDueDate`, subsequent repayments follow the schedule
      repaymentQueries.push(
        db.insert(LoanRepayments).values({
          loanId: loanId,
          createdBy,
          scheduledDate: currentDate.toISOString().split("T")[0], // ✅ Use exact date for first repayment
          amount: EMI,
          principalAmount: Math.round(principalForThisPayment),
          interestAmount: Math.round(interestForThisPayment),
          status: "pending",
        })
      );

      // Move to the next repayment date AFTER inserting the first one
      currentDate.setMonth(currentDate.getMonth() + repaymentInterval);
    }

    await Promise.all(repaymentQueries);
  } catch (error) {
    console.error("Error adding loan:", error);
    throw new Error("Failed to add loan");
  }
};

export const checkUpcomingPayments = async (createdBy: string) => {
  const today = new Date().toISOString().split("T")[0];

  const upcomingPayments = await db
    .select({
      loanId: LoanRepayments.loanId,
      scheduledDate: LoanRepayments.scheduledDate,
      amount: LoanRepayments.amount,
      status: LoanRepayments.status,
    })
    .from(LoanRepayments)
    .where(and(eq(LoanRepayments.createdBy, createdBy), eq(LoanRepayments.status, "pending")));

  return upcomingPayments;
};

export const getPendingRepaymentsCount = async (createdBy: string) => {
  const today = new Date().toISOString().split("T")[0]; 

  const pendingRepayments = await db
    .select({ count: sql<number>`COUNT(*)`.as("pending_count") }) 
    .from(LoanRepayments)
    .where(
      and(
        eq(LoanRepayments.createdBy, createdBy),
        eq(LoanRepayments.status, "pending"),
        lte(LoanRepayments.scheduledDate, today) 
      )
    );

  return pendingRepayments[0]?.count ?? 0; 
};


export const markRepaymentAsPaid = async (
  repaymentId: number,
  loanId: number,
  amountPaid: number,
  createdBy: string,
  principalAmount: number
) => {
  try {
    const expense = await createExpenseEntryForLoan(repaymentId);
    await db
      .update(LoanRepayments)
      .set({ amount: amountPaid, status: "paid", expenseId: expense.id })
      .where(eq(LoanRepayments.id, repaymentId));

    await upsertSpecificBalanceHistory(createdBy, new Date().toISOString().split("T")[0], amountPaid, "expense", "add");
    await updateRemainingPrincipal(loanId, principalAmount);

  } catch (error) {
    console.error("Error marking repayment as paid:", error);
    throw new Error("Failed to update repayment status");
  }
};

export const updateRemainingPrincipal = async (
  loanId: number,
  principalAmount: number
) => {
  try {
    const loan = await getLoanById(loanId);
    const remainingPrincipal = loan.principalAmount - principalAmount;
    await db
      .update(Loans)
      .set({ remainingPrincipal })
      .where(eq(Loans.id, loanId));
  } catch (error) {
    console.error("Error updating remaining principal:", error);
    throw new Error("Failed to update remaining principal");
  }
};

export const getLoanSummary = async (createdBy: string) => {
  const result = await db
    .select({
      totalLoans: sql<number>`COUNT(*)`.as("totalLoans"),
      totalOutstanding: sql<number>`SUM(remaining_balance)`.as("totalOutstanding"),
      nextEMI: sql<number>`MIN(monthly_emi)`.as("nextEMI"),
    })
    .from(Loans)
    .where(and(eq(Loans.createdBy, createdBy), eq(Loans.isPaidOff, false)));

  return result[0];
};

export const calculateEMI = (
  principal: number,
  interestRate: number,
  tenureMonths: number,
  repaymentFrequency: "monthly" | "bimonthly" | "weekly"
): number => {
  const monthlyRate = (interestRate / 12) / 100; // Convert annual interest to monthly rate

  let adjustedTenure = tenureMonths; // Default: Monthly
  if (repaymentFrequency === "bimonthly") {
    adjustedTenure = Math.ceil(tenureMonths / 2);
  } else if (repaymentFrequency === "weekly") {
    adjustedTenure = Math.ceil((tenureMonths * 4) / 1); // Weekly payments in the tenure
  }

  if (monthlyRate === 0) {
    return principal / adjustedTenure;
  }

  // round emi to whole number
  const emi = Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, adjustedTenure)) /
    (Math.pow(1 + monthlyRate, adjustedTenure) - 1));

  return parseFloat(emi.toFixed(2));
};

export const getLoanById = async (loanId: number) => {
  const loan = await db
    .select({
      id: Loans.id,
      createdBy: Loans.createdBy,
      lender: Loans.lender,
      principalAmount: Loans.principalAmount,
      interestRate: Loans.interestRate,
      tenureMonths: Loans.tenureMonths,
      repaymentFrequency: Loans.repaymentFrequency,
      EMI: Loans.EMI,
      nextDueDate: Loans.nextDueDate,
      isPaidOff: Loans.isPaidOff,
    })
    .from(Loans)
    .where(eq(Loans.id, loanId));

  return loan[0];
};

export const getLoanRepaymentById = async (loanRepaymentId: number) => {
  const loanRepayment = await db
    .select({
      id: LoanRepayments.id,
      loanId: LoanRepayments.loanId,
      createdBy: LoanRepayments.createdBy,
      scheduledDate: LoanRepayments.scheduledDate,
      amount: LoanRepayments.amount,
      status: LoanRepayments.status,
    })
    .from(LoanRepayments)
    .where(eq(LoanRepayments.id, loanRepaymentId));

  return loanRepayment[0];
};

export const createExpenseEntryForLoan = async (
  loanRepaymentId: number,
) => {
  const loanRepayment = await getLoanRepaymentById(loanRepaymentId);
  const loan = await getLoanById(loanRepayment.loanId!);

  const expense = await db.insert(Expenses).values({
    createdBy: loan.createdBy,
    name: `Loan Repayment - ${loan.lender}`,
    amount: loan.EMI,
    date: loanRepayment.scheduledDate,
    tagId: null,
  }).returning({ id: Expenses.id });

  return expense[0];
}

export const getLoansByUser = async (createdBy: string) => {
  const loans = await db
    .select({
      id: Loans.id,
      createdBy: Loans.createdBy,
      lender: Loans.lender,
      principalAmount: Loans.principalAmount,
      remainingPrincipal: Loans.remainingPrincipal,
      interestRate: Loans.interestRate,
      tenureMonths: Loans.tenureMonths,
      repaymentFrequency: Loans.repaymentFrequency,
      EMI: Loans.EMI,
      nextDueDate: Loans.nextDueDate,
      isPaidOff: Loans.isPaidOff,
    })
    .from(Loans)
    .where(eq(Loans.createdBy, createdBy));

  return loans;
};

export const getUpcomingPaymentsForLoan = async (loanId: number) => {
  const loanRepayments = await db
    .select({
      id: LoanRepayments.id,
      loanId: LoanRepayments.loanId,
      createdBy: LoanRepayments.createdBy,
      scheduledDate: LoanRepayments.scheduledDate,
      amount: LoanRepayments.amount,
      principalAmount: LoanRepayments.principalAmount,
      interestAmount: LoanRepayments.interestAmount,
      status: LoanRepayments.status,
    })
    .from(LoanRepayments)
    .where(eq(LoanRepayments.loanId, loanId))
    .orderBy(asc(LoanRepayments.scheduledDate));

  return loanRepayments;
};


export const addExtraLoanPayment = async (
  loanId: number,
  createdBy: string,
  extraAmount: number,
  fee: number,
  paymentDate: string
) => {
  try {
    const loan = await db.select().from(Loans).where(eq(Loans.id, loanId)).limit(1);
    if (!loan.length) throw new Error("Loan not found");

    const currentLoan = loan[0];
    const newRemainingPrincipal = Math.max(currentLoan.remainingPrincipal - extraAmount, 0);

    const nextRepayment = await db
      .select({ nextDate: LoanRepayments.scheduledDate })
      .from(LoanRepayments)
      .where(and(eq(LoanRepayments.loanId, loanId), eq(LoanRepayments.status, "pending")))
      .orderBy(asc(LoanRepayments.scheduledDate))
      .limit(1);

    if (!nextRepayment.length) throw new Error("No upcoming repayments found");

    const nextPaymentDate = nextRepayment[0].nextDate; 

    const expense = await db.insert(Expenses).values({
      createdBy,
      name: `Loan Repayment - ${currentLoan.lender}`,
      amount: Math.round(extraAmount + fee),
      date: paymentDate,
      tagId: null,
    }).returning({ id: Expenses.id });

    await upsertSpecificBalanceHistory(currentLoan.createdBy, paymentDate, Math.round(extraAmount + fee), "expense", "add")

    await db.insert(LoanRepayments).values({
      loanId,
      createdBy,
      scheduledDate: paymentDate,
      amount: Math.round(extraAmount + fee),
      principalAmount: Math.round(extraAmount),
      interestAmount: Math.round(fee),
      status: "paid",
      expenseId: expense[0].id,
    });

    await db
      .update(Loans)
      .set({ remainingPrincipal: newRemainingPrincipal })
      .where(eq(Loans.id, loanId));

    await db.delete(LoanRepayments).where(and(eq(LoanRepayments.loanId, loanId), eq(LoanRepayments.status, "pending")));

    let currentDate = new Date(nextPaymentDate);
    let repaymentInterval = currentLoan.repaymentFrequency === "bimonthly" ? 2 : currentLoan.repaymentFrequency === "weekly" ? 0.25 : 1;
    let remainingPrincipal = newRemainingPrincipal;
    let EMI = currentLoan.EMI;
    let interestRate = currentLoan.interestRate;
    let repaymentQueries = [];
    let repaymentCount = 0;

    while (remainingPrincipal > 0) {
      repaymentCount++;
      const interestForThisPayment = (remainingPrincipal * (parseInt(interestRate) / 100)) / 12;
      const principalForThisPayment = Math.min(EMI - interestForThisPayment, remainingPrincipal);
      const finalEMI = principalForThisPayment + interestForThisPayment;

      repaymentQueries.push(
        db.insert(LoanRepayments).values({
          loanId,
          createdBy,
          scheduledDate: currentDate.toISOString().split("T")[0],
          amount: Math.round(finalEMI),
          principalAmount: Math.round(principalForThisPayment),
          interestAmount: Math.round(interestForThisPayment),
          status: "pending",
        })
      );

      remainingPrincipal = Math.max(remainingPrincipal - principalForThisPayment, 0);
      currentDate.setMonth(currentDate.getMonth() + repaymentInterval);
    }

    await Promise.all(repaymentQueries);
    console.log(`Loan rescheduled with ${repaymentCount} remaining repayments`);

    return { message: "Extra payment applied, loan rescheduled successfully" };
  } catch (error) {
    console.error("Error processing extra loan payment:", error);
    throw new Error("Failed to process extra loan payment");
  }
};


export const deleteLoan = async (loanId: number, createdBy: string) => {
  // Get all repayments with their expense info before deleting
  const allRepayments = await db.select({ 
    id: LoanRepayments.id, 
    expenseId: LoanRepayments.expenseId, 
    scheduledDate: LoanRepayments.scheduledDate, 
    amount: LoanRepayments.amount 
  }).from(LoanRepayments).where(eq(LoanRepayments.loanId, loanId))
  
  // Store expense info before deleting loan repayments
  const expensesToDelete: Array<{ id: number; date: string; amount: number }> = []
  for (let i = 0; i < allRepayments.length; i++) {
    if (allRepayments[i].expenseId !== null) {
      expensesToDelete.push({
        id: allRepayments[i].expenseId!,
        date: allRepayments[i].scheduledDate,
        amount: allRepayments[i].amount
      })
    }
  }
  
  // First, delete all loan repayments (this removes the foreign key constraint)
  await db.delete(LoanRepayments).where(eq(LoanRepayments.loanId, loanId))
  
  // Then, delete all associated expenses
  for (const expense of expensesToDelete) {
    await deleteExpense(expense.id, expense.date, expense.amount, createdBy)
  }
  
  // Finally, delete the loan
  const result = await db.delete(Loans).where(eq(Loans.id, loanId)).returning()
}

export const deleteLoanRepayment = async (loanRepaymentId: number, createdBy: string) => {
  const result = await db.delete(LoanRepayments).where(and(eq(LoanRepayments.id, loanRepaymentId), eq(LoanRepayments.createdBy, createdBy))).returning()
}