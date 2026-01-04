'use client'
import { db } from '@/utils/dbConfig'
import { Budgets, Tags, Expenses } from '@/utils/schema'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { eq, sql, desc } from 'drizzle-orm'
import { Budget } from '../../_type/type'
import BudgetItem from './BudgetItem'
import CreateBudget from './CreateBudget'
import BudgetItemSkeleton from './BudgetItemSkeleton'

function BudgetList() {

  const { user } = useUser()
  const [budgets, setBudgets] = useState<Budget[]>([])

  const getBudgetsByUser = async (userEmail: string) => {
    try {
      // Get budgets with tag count (separate query to avoid duplication)
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
        .where(eq(Budgets.createdBy, userEmail))
        .groupBy(Budgets.id);

      // Get expense totals per budget (separate query to avoid duplication from Tags join)
      const expenseTotals = await db
        .select({
          budgetId: Expenses.budgetId,
          totalSpent: sql<number>`COALESCE(SUM(${Expenses.amount}), 0)`.as("total_spent"),
          expenseCount: sql<number>`COUNT(${Expenses.id})`.as("expense_count"),
        })
        .from(Expenses)
        .where(eq(Expenses.createdBy, userEmail))
        .groupBy(Expenses.budgetId);

      // Combine the results
      const expenseMap = new Map(expenseTotals.map(e => [e.budgetId, { totalSpent: Number(e.totalSpent), expenseCount: Number(e.expenseCount) }]));
      
      const budgets = budgetsWithTags.map(budget => ({
        ...budget,
        tagCount: Number(budget.tagCount),
        totalSpent: expenseMap.get(budget.id)?.totalSpent || 0,
        expenseCount: expenseMap.get(budget.id)?.expenseCount || 0,
      })).sort((a, b) => b.id - a.id);

      return budgets;
    } catch (error) {
      console.error("Error fetching budgets:", error);
      throw new Error("Failed to fetch budgets");
    }
  }

  const fetchBudgets = async () => {
    const budgets = await getBudgetsByUser(user?.primaryEmailAddress?.emailAddress!)
    setBudgets(budgets)
  }

  useEffect(() => {
    fetchBudgets()
  }, [user])

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-7'>
        <CreateBudget refreshData={() => fetchBudgets()} />
        {budgets.length > 0 ? budgets.map((budget, index) => (
          <BudgetItem key={index} budget={budget} />
        ))
          :
          <BudgetItemSkeleton />
        }
      </div>
    </div>
  )
}

export default BudgetList