import { eq } from "drizzle-orm";
import { db } from "./dbConfig";
import { recalcBalanceHistoryFromDate } from "./recalcBalanceHistoryFromDate";
import { Expenses } from "./schema";

export const addExpense = async (
  createdBy: string,
  name: string,
  amount: number,
  date: string,
  budgetId: number | null,
  tagId: number | null
) => {
  try {
    await db.transaction(async (tx) => {
      // Insert expense
      const [expense] = await tx
        .insert(Expenses)
        .values({
          createdBy,
          name,
          amount,
          date,
          budgetId: budgetId,
          tagId: tagId
        })
        .returning({ id: Expenses.id });

      // Update balance history
      await recalcBalanceHistoryFromDate(createdBy, date, amount, "expense", "add");
    });
  } catch (error) {
    console.error("Error adding expense:", error);
    throw new Error("Failed to add expense");
  }
};

export const deleteExpense = async (expenseId: number, date: string, amount: number, createdBy: string) => {
  const result = await db.delete(Expenses).where(eq(Expenses.id, expenseId)).returning()
  if (result) {
    recalcBalanceHistoryFromDate(createdBy, date, amount, "expense", "deduct");
  }
}