'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SavingGoalWithContributions } from '../../_type/type'
import { format } from 'date-fns'
import { Target, Plus, Trash2 } from 'lucide-react'
import AddContribution from './AddContribution'
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
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                {goal.title}
              </CardTitle>
              <div className='mt-2 flex items-center gap-4 text-sm text-muted-foreground'>
                <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                <span>•</span>
                <span>Target Date: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setShowAddContribution(true)}
                disabled={isCompleted}
              >
                <Plus className='h-4 w-4 mr-1' />
                Add Savings
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size='sm' variant='outline' className='text-red-600 hover:text-red-700'>
                    <Trash2 className='h-4 w-4' />
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
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>
                  Progress: ${goal.totalSaved.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                </span>
                <span className='text-sm font-medium'>{goal.progress.toFixed(1)}%</span>
              </div>
              <Progress value={goal.progress} className='h-2' />
              <div className='flex items-center gap-2 mt-2'>
                {isCompleted && (
                  <Badge className='bg-green-500'>Completed</Badge>
                )}
                {isOverdue && !isCompleted && (
                  <Badge variant='destructive'>Overdue</Badge>
                )}
                {!isCompleted && !isOverdue && (
                  <Badge variant='outline'>
                    ${goal.remainingAmount.toLocaleString()} remaining
                  </Badge>
                )}
              </div>
            </div>

            {goal.contributions.length > 0 && (
              <div>
                <h4 className='text-sm font-medium mb-2'>Contributions ({goal.contributions.length})</h4>
                <div className='space-y-2'>
                  {goal.contributions.map((contribution) => (
                    <div
                      key={contribution.id}
                      className='flex items-center justify-between p-2 bg-slate-50 rounded text-sm'
                    >
                      <span>{format(new Date(contribution.date), 'MMM dd, yyyy')}</span>
                      <span className='font-medium'>${contribution.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

