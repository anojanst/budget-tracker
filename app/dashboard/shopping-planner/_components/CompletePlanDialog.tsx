'use client'
import React, { useState } from 'react'
import { db } from '@/utils/dbConfig'
import { ShoppingPlans } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'
import AddItemAfterPurchase from './AddItemAfterPurchase'

function CompletePlanDialog({
  planId,
  refreshData,
}: {
  planId: number
  refreshData: () => void
}) {
  const [showAddItem, setShowAddItem] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await db
        .update(ShoppingPlans)
        .set({
          status: 'ready',
        })
        .where(eq(ShoppingPlans.id, planId))

      toast.success('Plan is ready for shopping!')
      refreshData()
    } catch (error) {
      console.error('Error completing plan:', error)
      toast.error('Failed to complete plan')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='default'>Complete Plan</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this plan as ready for shopping. You'll be able to mark items as purchased when you go shopping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant='outline'
              onClick={() => {
                setShowAddItem(true)
              }}
            >
              Add Item First
            </Button>
            <AlertDialogAction onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? 'Completing...' : 'Mark as Ready'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAddItem && (
        <AddItemAfterPurchase
          planId={planId}
          onClose={() => setShowAddItem(false)}
          refreshData={refreshData}
        />
      )}
    </>
  )
}

export default CompletePlanDialog

