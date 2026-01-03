'use client'
import React, { useState } from 'react'
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Target } from 'lucide-react'

function CreateSavingGoal({ refreshData }: { refreshData: () => void }) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      await db.insert(SavingGoals).values({
        createdBy: user.primaryEmailAddress.emailAddress,
        title: title.trim(),
        targetAmount: amount,
        targetDate: targetDate,
      })

      toast.success('Saving goal created successfully!')
      setTitle('')
      setTargetAmount('')
      setTargetDate('')
      setOpen(false)
      refreshData()
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error('Failed to create saving goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Target className='h-4 w-4 mr-2' />
          Create Goal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Saving Goal</DialogTitle>
          <DialogDescription>
            Set a financial goal with a target amount and date
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
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateSavingGoal

