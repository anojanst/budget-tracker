'use client'
import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/utils/dbConfig'
import { SavingGoals } from '@/utils/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PenBox } from 'lucide-react'
import { SavingGoalWithContributions } from '../../_type/type'
import { eq } from 'drizzle-orm'

function EditSavingGoal({ goal, refreshData }: { goal: SavingGoalWithContributions; refreshData: () => void }) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(goal.title)
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount.toString())
  const [targetDate, setTargetDate] = useState(goal.targetDate)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(goal.title)
      setTargetAmount(goal.targetAmount.toString())
      setTargetDate(goal.targetDate)
    }
  }, [open, goal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !targetAmount || !targetDate) {
      toast.error('Please fill in all fields')
      return
    }

    if (!user?.primaryEmailAddress?.emailAddress) {
      toast.error('User not found')
      return
    }

    const amount = parseInt(targetAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsSubmitting(true)
    try {
      await db
        .update(SavingGoals)
        .set({
          title: title.trim(),
          targetAmount: amount,
          targetDate: targetDate,
        })
        .where(eq(SavingGoals.id, goal.id))

      toast.success('Saving goal updated successfully!')
      setOpen(false)
      refreshData()
    } catch (error) {
      console.error('Error updating goal:', error)
      toast.error('Failed to update saving goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline' className='h-8 md:h-9'>
          <PenBox className='h-3.5 w-3.5 md:h-4 md:w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Saving Goal</DialogTitle>
          <DialogDescription>
            Update your saving goal details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>Goal Title</label>
            <Input
              placeholder='e.g., Vacation Fund'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Target Amount ($)</label>
            <Input
              type='number'
              placeholder='e.g., 5000'
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
              min='1'
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Target Date</label>
            <Input
              type='date'
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditSavingGoal

