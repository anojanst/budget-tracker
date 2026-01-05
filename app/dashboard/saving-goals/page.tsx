'use client'
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/utils/dbConfig'
import { SavingGoals, SavingContributions } from '@/utils/schema'
import { eq, desc } from 'drizzle-orm'
import { SavingGoalWithContributions } from '../_type/type'
import SavingGoalList from './_components/SavingGoalList'
import CreateSavingGoal from './_components/CreateSavingGoal'
import SavingGoalsTimeline from './_components/SavingGoalsTimeline'

function SavingGoalsPage() {
  const { user } = useUser()
  const [goals, setGoals] = useState<SavingGoalWithContributions[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  const fetchGoals = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return

    setLoading(true)
    try {
      const allGoals = await db
        .select()
        .from(SavingGoals)
        .where(eq(SavingGoals.createdBy, user.primaryEmailAddress.emailAddress))
        .orderBy(desc(SavingGoals.id))

      const goalsData = await Promise.all(
        allGoals.map(async (goal) => {
          const contributions = await db
            .select()
            .from(SavingContributions)
            .where(eq(SavingContributions.goalId, goal.id))
            .orderBy(desc(SavingContributions.date))

          const totalSaved = contributions.reduce((sum, c) => sum + c.amount, 0)
          const progress = (totalSaved / goal.targetAmount) * 100
          const remainingAmount = goal.targetAmount - totalSaved

          return {
            ...goal,
            contributions,
            totalSaved,
            progress: Math.min(progress, 100),
            remainingAmount: Math.max(remainingAmount, 0),
          }
        })
      )

      setGoals(goalsData)
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className='flex justify-between pb-3 border-b-2 border-b-slate-100'>
        <h1 className='font-bold text-xl'>Saving Goals</h1>
        <CreateSavingGoal refreshData={fetchGoals} />
      </div>

      {loading ? (
        <div className='mt-6'>Loading...</div>
      ) : goals.length === 0 ? (
        <div className='mt-6 text-center text-muted-foreground'>
          <p>No saving goals yet. Create one to get started!</p>
        </div>
      ) : (
        <>
          <SavingGoalsTimeline goals={goals} />
          <div className='mt-6 space-y-4'>
            {goals.map((goal) => (
              <SavingGoalList
                key={goal.id}
                goal={goal}
                refreshData={fetchGoals}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default SavingGoalsPage

