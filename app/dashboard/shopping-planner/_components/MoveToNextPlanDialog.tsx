'use client'
import React, { useState, useEffect } from 'react'
import { db } from '@/utils/dbConfig'
import { ShoppingItems, ShoppingPlans } from '@/utils/schema'
import { eq, and } from 'drizzle-orm'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ShoppingItem } from '../../_type/type'
import { format } from 'date-fns'

function MoveToNextPlanDialog({
  item,
  planId,
  onClose,
  refreshData,
}: {
  item: ShoppingItem
  planId: number
  onClose: () => void
  refreshData: () => void
}) {
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nextPlanId, setNextPlanId] = useState<number | null>(null)

  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  useEffect(() => {
    const findOrCreateNextPlan = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return

      try {
        // Get current plan date
        const currentPlan = await db
          .select()
          .from(ShoppingPlans)
          .where(eq(ShoppingPlans.id, planId))
          .limit(1)

        if (currentPlan.length === 0) return

        const currentDate = new Date(currentPlan[0].planDate)
        const nextDate = new Date(currentDate)
        nextDate.setDate(nextDate.getDate() + 1)
        const nextDateStr = format(nextDate, 'yyyy-MM-dd')

        // Check if next plan exists
        const existingPlan = await db
          .select()
          .from(ShoppingPlans)
          .where(
            and(
              eq(ShoppingPlans.createdBy, user.primaryEmailAddress.emailAddress),
              eq(ShoppingPlans.planDate, nextDateStr),
              eq(ShoppingPlans.status, 'draft')
            )
          )
          .limit(1)

        if (existingPlan.length > 0) {
          setNextPlanId(existingPlan[0].id)
        } else {
          // Create next plan
          const newPlan = await db
            .insert(ShoppingPlans)
            .values({
              createdBy: user.primaryEmailAddress.emailAddress,
              planDate: nextDateStr,
              status: 'draft',
            })
            .returning({ id: ShoppingPlans.id })

          if (newPlan.length > 0) {
            setNextPlanId(newPlan[0].id)
          }
        }
      } catch (error) {
        console.error('Error finding/creating next plan:', error)
      }
    }

    findOrCreateNextPlan()
  }, [user, planId])

  const handleMove = async () => {
    if (!nextPlanId) {
      toast.error('Could not find or create next plan')
      return
    }

    setIsSubmitting(true)
    try {
      // Mark current item as moved
      await db
        .update(ShoppingItems)
        .set({
          isMovedToNext: true,
        })
        .where(eq(ShoppingItems.id, item.id))

      // Create a copy in the next plan
      await db.insert(ShoppingItems).values({
        planId: nextPlanId,
        name: toTitleCase(item.name.trim()),
        quantity: item.quantity,
        uom: item.uom || null,
        needWant: item.needWant,
        estimatePrice: item.estimatePrice,
        actualPrice: null,
        isPurchased: false,
        isMovedToNext: false,
      })

      toast.success('Item moved to next plan!')
      refreshData()
      onClose()
    } catch (error) {
      console.error('Error moving item:', error)
      toast.error('Failed to move item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Item to Next Plan</DialogTitle>
          <DialogDescription>
            Move "{item.name}" to the next shopping plan?
          </DialogDescription>
        </DialogHeader>
        <div className='flex gap-2'>
          <Button onClick={handleMove} disabled={isSubmitting || !nextPlanId}>
            {isSubmitting ? 'Moving...' : 'Move to Next Plan'}
          </Button>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MoveToNextPlanDialog

