'use client'
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/utils/dbConfig'
import { SavingGoals, SavingContributions } from '@/utils/schema'
import { eq, sql } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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

  return (
    <Card className='mt-4'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Target className='h-5 w-5' />
            Saving Goals
          </CardTitle>
          <Link href='/dashboard/saving-goals'>
            <Button variant='outline' size='sm'>
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Total Saved</span>
            <span className='text-lg font-semibold'>
              ${goalsSummary.totalSaved.toLocaleString()} / ${goalsSummary.totalTarget.toLocaleString()}
            </span>
          </div>
          <div className='w-full bg-slate-200 rounded-full h-2'>
            <div
              className='bg-green-500 h-2 rounded-full transition-all'
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
          <div className='flex items-center justify-between text-sm'>
            <div>
              <span className='text-muted-foreground'>Active: </span>
              <span className='font-medium'>{goalsSummary.activeGoals}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>Completed: </span>
              <span className='font-medium text-green-600'>{goalsSummary.completedGoals}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>Progress: </span>
              <span className='font-medium'>{overallProgress.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SavingGoalsSummary

