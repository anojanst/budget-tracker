'use client'
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import BudgetSummary from './_components/BudgetSummary'
import BudgetPieChart from './_components/BudgetPieChart'
import BudgetComparisonChart from './_components/BudgetComparisonChart'
import { db } from '@/utils/dbConfig'
import { Budgets, Tags, Expenses, LoanRepayments } from '@/utils/schema'
import { eq, sql, gte, lte, and } from 'drizzle-orm'
import IncomeExpenseBalanceChart from './_components/IncomeExpenseBalanceChart'
import { format, startOfMonth } from 'date-fns'

function Dashboard() {
  const { user } = useUser()
  const [total_amount_spent, setTotalAmountSpent] = useState<number>(0)
  const [total_budget_amount, setTotalBudgetAmount] = useState<number>(0)
  const [total_expense_count, setTotalExpenseCount] = useState<number>(0)

  const getSummaryByUser = async (userEmail: string) => {
    try {
      const today = new Date();
      const startDate = startOfMonth(today);

      const formattedToday = format(today, "yyyy-MM-dd");
      const formattedStartDate = format(startDate, "yyyy-MM-dd");

      // ✅ Step 1: Get total budget amount from Budgets table
      const totalBudget = await db
        .select({
          totalBudgetAmount: sql<number>`COALESCE(SUM(${Budgets.amount}), 0)`.as("total_budget_amount"),
        })
        .from(Budgets)
        .where(eq(Budgets.createdBy, userEmail));

      // ✅ Step 2: Get loan repayments scheduled for this month
      const totalLoanRepayments = await db
        .select({
          totalLoanRepayments: sql<number>`COALESCE(SUM(${LoanRepayments.amount}), 0)`.as("total_loan_repayments"),
        })
        .from(LoanRepayments)
        .where(
          and(
            eq(LoanRepayments.createdBy, userEmail),
            eq(LoanRepayments.status, "pending"), // Only count pending repayments
            gte(LoanRepayments.scheduledDate, formattedStartDate),
            lte(LoanRepayments.scheduledDate, formattedToday)
          )
        );

      // ✅ Step 3: Get total expenses for the current month
      const totals = await db
        .select({
          totalAmountSpent: sql<number>`COALESCE(SUM(${Expenses.amount}), 0)`.as("total_amount_spent"),
          totalExpenseCount: sql<number>`COUNT(${Expenses.id})`.as("total_expense_count"),
        })
        .from(Expenses)
        .where(
          and(
            eq(Expenses.createdBy, userEmail),
            gte(Expenses.date, formattedStartDate),
            lte(Expenses.date, formattedToday)
          )
        );

        console.log(totals)

      // ✅ Step 4: Update state with calculated values
      const finalTotalBudget = Number(totalBudget[0].totalBudgetAmount) + Number(totalLoanRepayments[0].totalLoanRepayments);

      setTotalBudgetAmount(finalTotalBudget);
      setTotalAmountSpent(totals[0].totalAmountSpent);
      setTotalExpenseCount(totals[0].totalExpenseCount);

      return {
        totalBudgetAmount: finalTotalBudget,
        totalLoanRepayments: totalLoanRepayments[0].totalLoanRepayments,
        totalAmountSpent: totals[0].totalAmountSpent,
        totalExpenseCount: totals[0].totalExpenseCount
      };
    } catch (error) {
      console.error("Error fetching budgets:", error);
      throw new Error("Failed to fetch budgets");
    }
  };



  const fetchTotals = async () => {
    const totals = await getSummaryByUser(user?.primaryEmailAddress?.emailAddress!)
    console.log(totals)
  }

  useEffect(() => {
    user && fetchTotals()
  }, [user])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold sm:text-3xl">
        Hi, {user?.fullName} 👋
      </h1>
      <p className="text-muted-foreground">Track Smart, Spend Wise, Save More!</p>

      <div className="mt-4">
        <BudgetSummary
          total_amount_spent={total_amount_spent}
          total_budget_amount={total_budget_amount}
          total_expense_count={total_expense_count}
        />
      </div>

      {total_expense_count > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-6 lg:grid-cols-7">
          <div className="sm:col-span-1 md:col-span-4 lg:col-span-3 rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-medium">Income vs Expense</h3>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="w-full">
                <div className="aspect-[16/10] sm:aspect-[16/9] min-h-[220px]">
                  <IncomeExpenseBalanceChart count={total_expense_count} />
                </div>
              </div>
            </div>
          </div>
          <div className=" sm:col-span-1 md:col-span-2 lg:col-span-2 rounded-lg border bg-card p-3">
            <h3 className="pb-2 text-sm font-medium">Budget Split</h3>
            <div className="aspect-[1/1] min-h-[220px]">
              <BudgetPieChart />
            </div>
          </div>
          <div className="sm:col-span-1 md:col-span-2 lg:col-span-2 rounded-lg border bg-card p-3">
            <h3 className="pb-2 text-sm font-medium">Budget vs Spent</h3>
            <div className="aspect-[16/12] min-h-[220px]">
              <BudgetComparisonChart />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
          No expenses yet. Add your first expense to see charts here.
        </div>
      )}
    </div>
  )
}

export default Dashboard