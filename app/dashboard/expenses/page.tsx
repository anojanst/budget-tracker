'use client'
import { Budgets, Expenses, Tags } from '@/utils/schema'
import { useEffect, useState } from 'react'
import { eq, and, asc, sql } from 'drizzle-orm'
import { db } from '@/utils/dbConfig'
import { useUser } from '@clerk/nextjs'
import { Expense } from '../_type/type'
import ExpenseItem from './[id]/_components/ExpenseItem'
import { Skeleton } from '@/components/ui/skeleton'

function ExpensesScreen() {
  const { user } = useUser()
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    user && fetchData()
  }, [user])

  const fetchData = async () => {
    const expenses = await getExpenses(user?.primaryEmailAddress?.emailAddress!)
    setExpenses(expenses)
  }

  const getExpenses = async ( userEmail: string) => {
    try {
      // Get all expenses with their budget and tag info
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
        .where(eq(Expenses.createdBy, userEmail))
        .orderBy(asc(Expenses.date));

      return expenses;
    } catch (error) {
      console.error("Error fetching expenses:", error);
      throw new Error("Failed to fetch expenses");
    }
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className='flex justify-between pb-3 border-b-2 border-b-slate-100'>
        <h1 className='font-bold text-xl'>My Expenses</h1>
      </div>
      
      <div className='grid grid-cols-1 mt-4'>
        <div className='col-span-1'>
          {expenses.length > 0 ? expenses.map((expense, index) => (
            <ExpenseItem key={index} expense={expense} refreshData={() => fetchData()} />
          )) : <Skeleton className='h-10 w-full' />}
        </div>
        
      </div>
    </div>
  )
}

export default ExpensesScreen