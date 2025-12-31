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

function AddPriceDialog({
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

    if (!actualPrice) {
      toast.error('Please enter the actual price')
      return
    }

    setIsSubmitting(true)
    try {
      await db
        .update(ShoppingItems)
        .set({
          actualPrice: parseFloat(actualPrice),
        })
        .where(eq(ShoppingItems.id, item.id))

      toast.success('Price added successfully!')
      refreshData()
      onClose()
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update price')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.actualPrice === null ? 'Add' : 'Edit'} Actual Price</DialogTitle>
          <DialogDescription>
            {item.actualPrice === null 
              ? `Enter the actual price you paid for ${item.name}`
              : `Update the actual price for ${item.name}`
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>
              Estimated Price: ${item.estimatePrice.toFixed(2)}
            </label>
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Actual Price ($)</label>
            <Input
              type='number'
              step='0.01'
              placeholder='Enter actual price'
              value={actualPrice}
              onChange={(e) => setActualPrice(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className='flex gap-2'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : item.actualPrice === null ? 'Add Price' : 'Update Price'}
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

export default AddPriceDialog

