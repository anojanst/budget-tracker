'use client'
import { Budgets, Expenses, Tags } from '@/utils/schema'
import { useEffect, useState } from 'react'
import { eq, sql, and } from 'drizzle-orm'
import { db } from '@/utils/dbConfig'
import { useUser } from '@clerk/nextjs'
import { useParams } from 'next/navigation'
import { Budget, Expense, Tag } from '../../_type/type'
import BudgetItemSkeleton from '../../budgets/_components/BudgetItemSkeleton'
import AddExpenses from './_components/AddExpenses'
import TagsSection from './_components/TagsSection'
import ExpenseItem from './_components/ExpenseItem'
import BudgetSummary from './_components/BudgetSummary'
import { Skeleton } from '@/components/ui/skeleton'

function ExpensesPage() {
  const params = useParams()
  const budgetId = Number(params.id);
  const { user } = useUser()
  const [budget, setBudget] = useState<Budget>()
  const [tags, setTags] = useState<Tag[]>()
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    user && fetchData()
  }, [user])

  const fetchData = async () => {
    const budget = await getBudgetById(budgetId, user?.primaryEmailAddress?.emailAddress!)
    setBudget(budget)
    const tags = await getTagsByBudgetId(budgetId, user?.primaryEmailAddress?.emailAddress!)
    setTags(tags)
    const expenses = await getExpensesByBudget(budgetId, user?.primaryEmailAddress?.emailAddress!)
    setExpenses(expenses)
  }

  const getBudgetById = async (id: number, userEmail: string) => {
    try {
      // Get budget with tag count (separate query to avoid duplication)
      const budgetsWithTags = await db
        .select({
          id: Budgets.id,
          name: Budgets.name,
          amount: Budgets.amount,
          icon: Budgets.icon,
          createdBy: Budgets.createdBy,
          tagCount: sql<number>`COUNT(DISTINCT ${Tags.id})`.as("tag_count"),
        })
        .from(Budgets)
        .leftJoin(Tags, eq(Tags.budgetId, Budgets.id))
        .where(and(eq(Budgets.createdBy, userEmail), eq(Budgets.id, id)))
        .groupBy(Budgets.id);

      // Get expense totals for this budget (separate query to avoid duplication from Tags join)
      const expenseTotals = await db
        .select({
          totalSpent: sql<number>`COALESCE(SUM(${Expenses.amount}), 0)`.as("total_spent"),
          expenseCount: sql<number>`COUNT(${Expenses.id})`.as("expense_count"),
        })
        .from(Expenses)
        .where(and(eq(Expenses.createdBy, userEmail), eq(Expenses.budgetId, id)));

      // Combine the results
      const budget = budgetsWithTags[0];
      if (!budget) return undefined;

      return {
        ...budget,
        tagCount: Number(budget.tagCount),
        totalSpent: Number(expenseTotals[0]?.totalSpent || 0),
        expenseCount: Number(expenseTotals[0]?.expenseCount || 0),
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      throw new Error("Failed to fetch budgets");
    }
  }

  const getTagsByBudgetId = async (id: number, userEmail: string) => {
    try {
      const tags = await db
        .select({
          id: Tags.id,
          name: Tags.name,
          createdBy: Tags.createdBy,
          totalSpent: sql<number>`COALESCE(SUM(${Expenses.amount}), 0)`.as("total_spent"),
          expenseCount: sql<number>`COUNT(${Expenses.id})`.as("expense_count"),
        })
        .from(Tags)
        .leftJoin(Expenses, eq(Expenses.tagId, Tags.id))
        .where(and(eq(Tags.createdBy, userEmail), eq(Tags.budgetId, id)))
        .groupBy(Tags.id);

      return tags;
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw new Error("Failed to fetch tags");
    }
  }

  const getExpensesByBudget = async (budgetId: number, userEmail: string) => {
    try {
      // Get expenses that belong to this budget (using budgetId directly)
      const expenses = await db
        .select({
          id: Expenses.id,
          name: Expenses.name,
          amount: Expenses.amount,
          createdBy: Expenses.createdBy,
          date: Expenses.date,
          budgetId: Expenses.budgetId,
          tagId: Expenses.tagId,
          tagName: Tags.name,
          budgetName: Budgets.name,
        })
        .from(Expenses)
        .leftJoin(Tags, eq(Expenses.tagId, Tags.id))
        .leftJoin(Budgets, eq(Expenses.budgetId, Budgets.id))
        .where(and(eq(Expenses.budgetId, budgetId), eq(Expenses.createdBy, userEmail)))
        .orderBy(Expenses.date);

      return expenses;
    } catch (error) {
      console.error("Error fetching expenses:", error);
      throw new Error("Failed to fetch expenses");
    }
  }

  return (
    <div className='w-full px-2 py-3 pb-6 md:px-4 md:py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto'>
      {/* Budget Summary and Add Expense - Mobile: stacked, Desktop: side by side */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 items-stretch'>
        {/* Budget Summary */}
        <div className='flex'>
          {budget ? (
            <div className='w-full'>
              <BudgetSummary budget={budget} refreshData={() => fetchData()} />
            </div>
          ) : (
            <BudgetItemSkeleton />
          )}
        </div>

        {/* Add Expense */}
        <div className='flex'>
          {budget ? (
            <div className='border rounded-lg p-3 md:p-4 bg-card w-full flex flex-col'>
              <AddExpenses refreshData={() => fetchData()} tags={tags ? tags : []} budgetId={budgetId} />
            </div>
          ) : (
            <Skeleton className='h-full w-full' />
          )}
        </div>
      </div>

      {/* Expenses and Tags - Mobile: stacked (expenses first, tags last), Desktop: side by side */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6'>
        {/* Expenses List */}
        <div className='lg:col-span-2 order-1 lg:order-1'>
          <div className='border rounded-lg p-3 md:p-4 bg-card'>
            <h2 className='font-semibold text-base md:text-lg mb-3 md:mb-4'>Expenses</h2>
            {expenses.length > 0 ? (
              <div className='space-y-2'>
                {expenses.map((expense, index) => (
                  <ExpenseItem key={index} expense={expense} refreshData={() => fetchData()} />
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-muted-foreground text-sm'>
                <p>No expenses yet. Add your first expense above!</p>
              </div>
            )}
          </div>
        </div>

        {/* Tags Section - Mobile: last (order-2), Desktop: sidebar (order-2) */}
        <div className='lg:col-span-1 order-2 lg:order-2'>
          {budget ? (
            <TagsSection refreshData={() => fetchData()} budgetId={budget.id} tags={tags} />
          ) : (
            <Skeleton className='h-40 w-full' />
          )}
        </div>
      </div>
    </div>
  )
}

export default ExpensesPage