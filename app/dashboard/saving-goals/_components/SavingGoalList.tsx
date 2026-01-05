'use client'
import React, { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SavingGoalWithContributions } from '../../_type/type'
import { format } from 'date-fns'
import { Target, Plus, Trash2 } from 'lucide-react'
import AddContribution from './AddContribution'
import EditSavingGoal from './EditSavingGoal'
import { db } from '@/utils/dbConfig'
import { SavingGoals, SavingContributions, Expenses } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function SavingGoalList({
  goal,
  refreshData,
}: {
  goal: SavingGoalWithContributions
  refreshData: () => void
}) {
  const [showAddContribution, setShowAddContribution] = useState(false)

  const handleDeleteGoal = async () => {
    try {
      // Delete all contributions first (which will cascade delete expenses if needed)
      await db.delete(SavingContributions).where(eq(SavingContributions.goalId, goal.id))
      
      // Delete the goal
      await db.delete(SavingGoals).where(eq(SavingGoals.id, goal.id))
      
      toast.success('Goal deleted successfully')
      refreshData()
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast.error('Failed to delete goal')
    }
  }

  const isCompleted = goal.progress >= 100
  const isOverdue = new Date(goal.targetDate) < new Date() && !isCompleted

  return (
    <>
      <div className='border rounded-lg p-3 md:p-4 bg-card'>
        {/* Header */}
        <div className='flex items-start justify-between gap-2 mb-4'>
          {/* Title and Info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-2'>
              <Target className='h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0' />
              <h2 className='font-bold text-base md:text-lg truncate'>{goal.title}</h2>
            </div>
            <div className='flex flex-col gap-1 md:flex-row md:items-center md:gap-4 text-xs md:text-sm text-muted-foreground'>
              <span>Target: ${goal.targetAmount.toLocaleString()}</span>
              <span className='hidden md:inline'>•</span>
              <span>Target Date: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}</span>
            </div>
          </div>
          {/* Buttons - Top right on mobile, right side on desktop */}
          <div className='flex gap-1.5 md:gap-2 flex-shrink-0'>
            <Button
              size='sm'
              variant='outline'
              className='h-8 md:h-9'
              onClick={() => setShowAddContribution(true)}
              disabled={isCompleted}
            >
              <Plus className='h-3.5 w-3.5 md:h-4 md:w-4 mr-1' />
              <span className='hidden md:inline'>Add Savings</span>
            </Button>
            <EditSavingGoal goal={goal} refreshData={refreshData} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size='sm' variant='outline' className='h-8 md:h-9 text-red-600 hover:text-red-700'>
                  <Trash2 className='h-3.5 w-3.5 md:h-4 md:w-4' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Saving Goal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the goal and all its contributions. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGoal} className='bg-red-600 hover:bg-red-700'>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Progress Section */}
        <div className='mb-4 md:mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-xs md:text-sm font-medium'>
              Progress: ${goal.totalSaved.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
            </span>
            <div className='flex items-center gap-2'>
              <span className='text-xs md:text-sm font-medium'>{goal.progress.toFixed(1)}%</span>
              {isCompleted && (
                <Badge className='bg-green-500 text-xs'>Completed</Badge>
              )}
              {isOverdue && !isCompleted && (
                <Badge variant='destructive' className='text-xs'>Overdue</Badge>
              )}
              {!isCompleted && !isOverdue && (
                <Badge variant='outline' className='text-xs'>
                  ${goal.remainingAmount.toLocaleString()} remaining
                </Badge>
              )}
            </div>
          </div>
          <Progress value={goal.progress} className='h-2 md:h-2.5' />
        </div>

        {/* Contributions */}
        {goal.contributions.length > 0 && (
          <div>
            <h4 className='text-xs md:text-sm font-medium mb-3'>Contributions ({goal.contributions.length})</h4>
            <div className='space-y-2'>
              {goal.contributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className='flex items-center justify-between p-2 md:p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs md:text-sm'
                >
                  <span>{format(new Date(contribution.date), 'MMM dd, yyyy')}</span>
                  <span className='font-medium'>${contribution.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddContribution && (
        <AddContribution
          goalId={goal.id}
          goalTitle={goal.title}
          onClose={() => setShowAddContribution(false)}
          refreshData={refreshData}
        />
      )}
    </>
  )
}

export default SavingGoalList

