'use client'
import React, { useState } from 'react'
import { db } from '@/utils/dbConfig'
import { ShoppingItems } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ShoppingItem } from '../../_type/type'

function PurchaseItemDialog({
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
  const [actualPrice, setActualPrice] = useState(item.actualPrice?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      await db
        .update(ShoppingItems)
        .set({
          actualPrice: actualPrice || null, // numeric type expects string
          isPurchased: true,
        })
        .where(eq(ShoppingItems.id, item.id))

      toast.success('Item marked as purchased!')
      refreshData()
      onClose()
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Purchased</DialogTitle>
          <DialogDescription>
            Mark {item.name} as purchased. You can add the actual price now or later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>
              Estimated Price: ${item.estimatePrice.toFixed(2)}
            </label>
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Actual Price ($) <span className='text-muted-foreground font-normal'>(Optional)</span></label>
            <Input
              type='number'
              step='0.01'
              placeholder='Enter actual price (optional)'
              value={actualPrice}
              onChange={(e) => setActualPrice(e.target.value)}
            />
          </div>
          <div className='flex gap-2'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Mark as Purchased'}
            </Button>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PurchaseItemDialog

