'use client'
import { Budgets, Expenses, Tags } from '@/utils/schema'
import { useEffect, useState } from 'react'
import { eq, sql, and } from 'drizzle-orm'
import { db } from '@/utils/dbConfig'
import { useUser } from '@clerk/nextjs'
import { useParams } from 'next/navigation'
import { Budget, Expense, Tag } from '../../_type/type'
import BudgetItem from '../../budgets/_components/BudgetItem'
import BudgetItemSkeleton from '../../budgets/_components/BudgetItemSkeleton'
import AddExpenses from './_components/AddExpenses'
import AddTags from './_components/AddTags'
import TagItem from './_components/TagItem'
import ExpenseItem from './_components/ExpenseItem'
import { Skeleton } from '@/components/ui/skeleton'
import DeleteBudget from './_components/DeteleBudget'
import EditBudget from './_components/EditBudget'

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
        .leftJoin(Expenses, eq(Expenses.tagId, Tags.id))
        .where(and(eq(Budgets.createdBy, userEmail), eq(Budgets.id, id)))
        .groupBy(Budgets.id);

      return budgets[0]
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
      const expenses = await db
        .select({
          id: Expenses.id,
          name: Expenses.name,
          amount: Expenses.amount,
          createdBy: Expenses.createdBy,
          date: Expenses.date,
          tagId: Expenses.tagId,
          tagName: Tags.name,
        })
        .from(Expenses)
        .innerJoin(Tags, eq(Expenses.tagId, Tags.id))
        .innerJoin(Budgets, eq(Tags.budgetId, Budgets.id))
        .where(and(eq(Budgets.id, budgetId), eq(Expenses.createdBy, userEmail)))
        .orderBy(Expenses.date);

      return expenses;
    } catch (error) {
      console.error("Error fetching expenses:", error);
      throw new Error("Failed to fetch expenses");
    }
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8'>
      <div className='flex justify-between pb-3 border-b-2 border-b-slate-100'>
        <h1 className='font-bold text-2xl'>{budget?.name}</h1>
        <div className='flex gap-2'>
          <EditBudget budget={budget!} refreshData={() => fetchData()} />
          <DeleteBudget budgetId={budget?.id!} />
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 mt-2'>
        <div className='col-span-1 lg:col-span-2 grid'>
          <div>
            <h2 className='font-semibold lg:-mb-3'>Summary</h2>
          </div>
          {budget ? <BudgetItem budget={budget} /> : <BudgetItemSkeleton />}

        </div>
        <div className='col-span-1 lg:col-span-3'>
          {budget ? <AddExpenses refreshData={() => fetchData()} tags={tags ? tags : []} /> : <Skeleton className='h-40 w-full' />}
        </div>
        <div className='col-span-1 lg:col-span-2'>
          {budget ? <AddTags refreshData={() => fetchData()} budgetId={budget?.id!} /> : <Skeleton className='h-40 w-full' />}
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-5 mt-7'>
        <div className='col-span-1 lg:col-span-5 border rounded-lg p-2'>
          <h2 className='font-semibold'>Latest Expenses</h2>
          {expenses.length > 0 ? expenses.map((expense, index) => (
            <ExpenseItem key={index} expense={expense} refreshData={() => fetchData()} />
          )) : <Skeleton className='h-10 w-full' />}
        </div>
        <div className='col-span-1 lg:col-span-2 border rounded-lg p-2'>
          <h1 className='font-semibold'>Tag List</h1>
          {tags ? tags.map((tag, index) => (
            <TagItem key={index} tag={tag} />
          )) : <Skeleton className='h-10 w-full' />}
        </div>
      </div>
    </div>
  )
}

export default ExpensesPage