'use client'
import React, { useState, useEffect } from 'react'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ShoppingItem } from '../../_type/type'

function BulkAddPricesDialog({
  items,
  planId,
  onClose,
  refreshData,
}: {
  items: ShoppingItem[]
  planId: number
  onClose: () => void
  refreshData: () => void
}) {
  const [prices, setPrices] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize prices with existing values or empty
  useEffect(() => {
    const initialPrices: Record<number, string> = {}
    items.forEach(item => {
      initialPrices[item.id] = item.actualPrice?.toString() || ''
    })
    setPrices(initialPrices)
  }, [items])

  const handlePriceChange = (itemId: number, value: string) => {
    setPrices(prev => ({
      ...prev,
      [itemId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      const updates = Object.entries(prices)
        .filter(([_, price]) => price && price.trim() !== '')
        .map(([itemId, price]) => ({
          id: parseInt(itemId),
          price: price // numeric type expects string
        }))

      if (updates.length === 0) {
        toast.error('Please enter at least one price')
        setIsSubmitting(false)
        return
      }

      // Update all items in parallel
      await Promise.all(
        updates.map(update =>
          db
            .update(ShoppingItems)
            .set({
              actualPrice: update.price,
            })
            .where(eq(ShoppingItems.id, update.id))
        )
      )

      toast.success(`Prices updated for ${updates.length} item${updates.length > 1 ? 's' : ''}!`)
      refreshData()
      onClose()
    } catch (error) {
      console.error('Error updating prices:', error)
      toast.error('Failed to update prices')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Bulk Add Prices</DialogTitle>
          <DialogDescription>
            Enter actual prices for purchased items. Leave blank to skip.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='space-y-3 py-4'>
            {items.map((item) => (
              <div key={item.id} className='flex items-center gap-3 p-3 border rounded-lg'>
                <div className='flex-1 min-w-0'>
                  <div className='font-semibold truncate'>{item.name}</div>
                  <div className='text-sm text-muted-foreground'>
                    {item.quantity} {item.uom ? item.uom : ''} {item.uom ? '•' : ''} Est: ${item.estimatePrice.toFixed(2)}
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>$</span>
                  <Input
                    type='number'
                    placeholder='0.00'
                    value={prices[item.id] || ''}
                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                    className='w-24'
                    step='0.01'
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Save Prices (${Object.values(prices).filter(p => p && p.trim() !== '').length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BulkAddPricesDialog

