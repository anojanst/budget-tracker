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
      const budgets = await db
        .select({
          id: Budgets.id,
          name: Budgets.name,
          amount: Budgets.amount,
          icon: Budgets.icon,
          createdBy: Budgets.createdBy,
          tagCount: sql<number>`COUNT(DISTINCT ${Tags.id})`.as("tag_count"),
          totalSpent: sql<number>`COALESCE(SUM(${Expenses.amount}), 0)`.as("total_spent"),
          expenseCount: sql<number>`COUNT(${Expenses.id})`.as("expense_count"),
        })
        .from(Budgets)
        .leftJoin(Tags, eq(Tags.budgetId, Budgets.id))
        .leftJoin(Expenses, eq(Expenses.budgetId, Budgets.id))
        .where(eq(Budgets.createdBy, userEmail))
        .groupBy(Budgets.id)
        .orderBy(desc(Budgets.id))

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