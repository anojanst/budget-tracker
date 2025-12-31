'use client'
import React, { useState } from 'react'
import { db } from '@/utils/dbConfig'
import { ShoppingItems } from '@/utils/schema'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function BulkAddItemsDialog({
  planId,
  onClose,
  refreshData,
}: {
  planId: number
  onClose: () => void
  refreshData: () => void
}) {
  const [itemsText, setItemsText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const commonUOMs = ['kg', 'g', 'lb', 'oz', 'L', 'mL', 'piece', 'pack', 'box', 'bottle', 'can', 'bag']

  const parseItems = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const items: Array<{
      name: string
      quantity: string
      uom: string | null
      needWant: 'need' | 'want'
      estimatePrice: string
    }> = []

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim()).filter(p => p)
      
      if (parts.length < 3) continue // Need at least name, quantity, and estimate

      const name = toTitleCase(parts[0])
      const quantity = parts[1] || '1'
      const estimatePrice = parts[2] || '0'

      if (!name || !quantity || !estimatePrice) continue

      items.push({
        name,
        quantity,
        uom: null,
        needWant: 'need' as 'need' | 'want',
        estimatePrice,
      })
    }

    return items
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!itemsText.trim()) {
      toast.error('Please enter at least one item')
      return
    }

    const items = parseItems(itemsText)

    if (items.length === 0) {
      toast.error('No valid items found. Please check the format.')
      return
    }

    setIsSubmitting(true)
    try {
      await Promise.all(
        items.map(item =>
          db.insert(ShoppingItems).values({
            planId: planId,
            name: item.name,
            quantity: parseFloat(item.quantity),
            uom: item.uom || null,
            needWant: item.needWant,
            estimatePrice: parseInt(item.estimatePrice),
            isPurchased: false,
            isMovedToNext: false,
          })
        )
      )

      toast.success(`${items.length} item${items.length > 1 ? 's' : ''} added successfully!`)
      refreshData()
      onClose()
    } catch (error) {
      console.error('Error adding items:', error)
      toast.error('Failed to add items')
    } finally {
      setIsSubmitting(false)
    }
  }

  const exampleText = `Milk, 2, 5
Bread, 1, 3
Chocolate, 1, 10`

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Bulk Add Items</DialogTitle>
          <DialogDescription>
            Add multiple items at once. One item per line. Format: Name, Quantity, Estimate Price
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            <div>
              <label className='text-sm font-medium mb-2 block'>Items (one per line)</label>
              <Textarea
                placeholder={exampleText}
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                className='min-h-[200px] font-mono text-sm'
                rows={8}
              />
              <p className='text-xs text-muted-foreground mt-2'>
                Format: Name, Quantity, Estimate Price
                <br />
                Example: Milk, 2, 5
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting || !itemsText.trim()}>
              {isSubmitting ? 'Adding...' : `Add Items (${parseItems(itemsText).length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BulkAddItemsDialog

