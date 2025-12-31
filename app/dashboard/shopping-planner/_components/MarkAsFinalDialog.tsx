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

function MarkAsFinalDialog({
  planId,
  refreshData,
}: {
  planId: number
  refreshData: () => void
}) {
  const [isFinalizing, setIsFinalizing] = useState(false)

  const handleFinalize = async () => {
    setIsFinalizing(true)
    try {
      await db
        .update(ShoppingPlans)
        .set({
          status: 'completed',
        })
        .where(eq(ShoppingPlans.id, planId))

      toast.success('Plan marked as final!')
      refreshData()
    } catch (error) {
      console.error('Error finalizing plan:', error)
      toast.error('Failed to mark plan as final')
    } finally {
      setIsFinalizing(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='default'>Mark as Final</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark Plan as Final</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to mark this plan as final? This will complete the shopping plan and move it to history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleFinalize} disabled={isFinalizing}>
            {isFinalizing ? 'Finalizing...' : 'Mark as Final'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default MarkAsFinalDialog

