'use client'
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/utils/dbConfig'
import { SavingGoals, SavingContributions } from '@/utils/schema'
import { eq, sql } from 'drizzle-orm'
import { Target, TrendingUp } from 'lucide-react'

function SavingGoalsSummary() {
  const { user } = useUser()
  const [goalsSummary, setGoalsSummary] = useState<{
    totalGoals: number
    totalSaved: number
    totalTarget: number
    activeGoals: number
    completedGoals: number
  } | null>(null)

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchSummary()
    }
  }, [user])

  const fetchSummary = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return

    try {
      const allGoals = await db
        .select()
        .from(SavingGoals)
        .where(eq(SavingGoals.createdBy, user.primaryEmailAddress.emailAddress))

      const goalsWithContributions = await Promise.all(
        allGoals.map(async (goal) => {
          const contributions = await db
            .select({
              totalSaved: sql<number>`COALESCE(SUM(${SavingContributions.amount}), 0)`.as("totalSaved"),
            })
            .from(SavingContributions)
            .where(eq(SavingContributions.goalId, goal.id))

          const saved = Number(contributions[0]?.totalSaved || 0)
          const progress = (saved / goal.targetAmount) * 100
          const isCompleted = progress >= 100

          return {
            ...goal,
            saved,
            isCompleted,
          }
        })
      )

      const totalSaved = goalsWithContributions.reduce((sum, g) => sum + g.saved, 0)
      const totalTarget = goalsWithContributions.reduce((sum, g) => sum + g.targetAmount, 0)
      const activeGoals = goalsWithContributions.filter((g) => !g.isCompleted).length
      const completedGoals = goalsWithContributions.filter((g) => g.isCompleted).length

      setGoalsSummary({
        totalGoals: allGoals.length,
        totalSaved,
        totalTarget,
        activeGoals,
        completedGoals,
      })
    } catch (error) {
      console.error('Error fetching saving goals summary:', error)
    }
  }

  if (!goalsSummary || goalsSummary.totalGoals === 0) {
    return null
  }

  const overallProgress = goalsSummary.totalTarget > 0 
    ? (goalsSummary.totalSaved / goalsSummary.totalTarget) * 100 
    : 0
  const remaining = goalsSummary.totalTarget - goalsSummary.totalSaved

  return (
    <div className='w-full border rounded-lg p-3 md:p-4 bg-card'>
      <div className="flex gap-2 items-center justify-between mb-3">
        <div className='flex gap-2 items-center'>
          <Target size={20} className='bg-primary text-white p-2 h-10 w-10 md:h-12 md:w-12 rounded-full' />
          <div className="flex flex-col">
            <div className="text-lg md:text-xl font-bold">Saving Goals</div>
            <div className="text-xs md:text-sm text-muted-foreground">{goalsSummary.totalGoals} Goals</div>
          </div>
        </div>
        <div className='text-right'>
          <div className="text-base md:text-lg font-semibold text-primary">${goalsSummary.totalTarget.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total Target</div>
        </div>
      </div>
      <div className='w-full mt-3'>
        <div className='flex gap-2 items-center justify-between text-gray-500 text-sm font-medium mb-2'>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-muted-foreground" />
            <p>${goalsSummary.totalSaved.toLocaleString()} saved</p>
          </div>
          <div className="flex items-center gap-2">
            <Target size={16} className="text-muted-foreground" />
            <p>${remaining >= 0 ? remaining.toLocaleString() : '0'} remaining</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 md:h-2.5">
          <div 
            className={`h-full rounded-full transition-all ${
              overallProgress >= 100 ? 'bg-green-500' : overallProgress > 50 ? 'bg-primary' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default SavingGoalsSummary

