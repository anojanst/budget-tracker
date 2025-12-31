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

function MarkTripCompleteDialog({
  planId,
  refreshData,
}: {
  planId: number
  refreshData: () => void
}) {
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await db
        .update(ShoppingPlans)
        .set({
          status: 'post_shopping',
        })
        .where(eq(ShoppingPlans.id, planId))

      toast.success('Trip marked as complete! You can now add prices and out-of-plan items.')
      refreshData()
    } catch (error) {
      console.error('Error completing trip:', error)
      toast.error('Failed to mark trip as complete')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='default'>Mark Trip Complete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark Trip as Complete</AlertDialogTitle>
          <AlertDialogDescription>
            Have you finished shopping? You'll be able to add actual prices and out-of-plan items when you get home.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleComplete} disabled={isCompleting}>
            {isCompleting ? 'Marking...' : 'Mark Complete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default MarkTripCompleteDialog

