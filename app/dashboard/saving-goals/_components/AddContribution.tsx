'use client'
import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/utils/dbConfig'
import { SavingContributions, Expenses } from '@/utils/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { recalcBalanceHistoryFromDate } from '@/utils/recalcBalanceHistoryFromDate'

function AddContribution({
  goalId,
  goalTitle,
  onClose,
  refreshData,
}: {
  goalId: number
  goalTitle: string
  onClose: () => void
  refreshData: () => void
}) {
  const { user } = useUser()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || !date) {
      toast.error('Please fill in all fields')
      return
    }

    if (!user?.primaryEmailAddress?.emailAddress) {
      toast.error('User not found')
      return
    }

    const contributionAmount = parseInt(amount)
    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsSubmitting(true)
    try {
      // Create expense for the contribution (savings reduce disposable income)
      const [expense] = await db
        .insert(Expenses)
        .values({
          createdBy: user.primaryEmailAddress!.emailAddress!,
          name: `Savings: ${goalTitle}`,
          amount: contributionAmount,
          date: date,
          budgetId: null, // No budget for savings
          tagId: null, // No tag for savings
        })
        .returning({ id: Expenses.id })

      // Create contribution linked to the expense
      await db.insert(SavingContributions).values({
        goalId: goalId,
        createdBy: user.primaryEmailAddress!.emailAddress!,
        amount: contributionAmount,
        date: date,
        expenseId: expense.id,
      })

      // Update balance history
      await recalcBalanceHistoryFromDate(
        user.primaryEmailAddress!.emailAddress!,
        date,
        contributionAmount,
        'expense',
        'add'
      )

      toast.success('Contribution added successfully!')
      setAmount('')
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      setDate(`${year}-${month}-${day}`)
      onClose()
      refreshData()
    } catch (error) {
      console.error('Error adding contribution:', error)
      toast.error('Failed to add contribution')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Savings Contribution</DialogTitle>
          <DialogDescription>
            Add money to your "{goalTitle}" goal. This will be recorded as an expense.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>Amount ($)</label>
            <Input
              type='number'
              placeholder='e.g., 500'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min='1'
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Date</label>
            <Input
              type='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={(() => {
                const today = new Date()
                const year = today.getFullYear()
                const month = String(today.getMonth() + 1).padStart(2, '0')
                const day = String(today.getDate()).padStart(2, '0')
                return `${year}-${month}-${day}`
              })()}
            />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Contribution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddContribution

