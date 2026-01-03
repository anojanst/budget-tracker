'use client'
import React, { useState } from 'react'
import { db } from '@/utils/dbConfig'
import { ShoppingItems } from '@/utils/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function AddItemAfterPurchase({
  planId,
  onClose,
  refreshData,
}: {
  planId: number
  onClose: () => void
  refreshData: () => void
}) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [uom, setUom] = useState('')
  const [needWant, setNeedWant] = useState<'need' | 'want'>('want')
  const [actualPrice, setActualPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const commonUOMs = ['kg', 'g', 'lb', 'oz', 'L', 'mL', 'piece', 'pack', 'box', 'bottle', 'can', 'bag']

  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !quantity || !actualPrice) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await db.insert(ShoppingItems).values({
        planId: planId,
        name: toTitleCase(name.trim()),
        quantity: quantity, // numeric type expects string
        uom: uom || null,
        needWant: needWant,
        estimatePrice: Math.round(parseFloat(actualPrice)), // Use actual price as estimate for unplanned items (round to integer)
        actualPrice: actualPrice, // numeric type expects string
        isPurchased: true,
        isMovedToNext: false,
        isOutOfPlan: true,
      })

      toast.success('Item added successfully!')
      setName('')
      setQuantity('1')
      setUom('')
      setActualPrice('')
      refreshData()
      onClose()
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item Purchased Outside Plan</DialogTitle>
          <DialogDescription>
            Add an item you purchased that wasn't in your original plan
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>Item Name</label>
            <Input
              placeholder='e.g., Snacks'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Quantity</label>
            <Input
              type='number'
              step='0.01'
              placeholder='e.g., 1'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Unit of Measure <span className='text-muted-foreground font-normal'>(Optional)</span></label>
            <div className='flex gap-2'>
              <Select value={uom || '__none__'} onValueChange={(value) => setUom(value === '__none__' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder='UOM (Optional)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__none__'>None</SelectItem>
                  {commonUOMs.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder='Custom'
                value={!commonUOMs.includes(uom || '') && uom ? uom : ''}
                onChange={(e) => setUom(e.target.value)}
                className='flex-1'
              />
            </div>
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Need/Want</label>
            <Select value={needWant} onValueChange={(value: 'need' | 'want') => setNeedWant(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='need'>Need</SelectItem>
                <SelectItem value='want'>Want</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Actual Price ($)</label>
            <Input
              type='number'
              step='0.01'
              placeholder='e.g., 5.99'
              value={actualPrice}
              onChange={(e) => setActualPrice(e.target.value)}
              required
            />
          </div>
          <div className='flex gap-2'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Item'}
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

export default AddItemAfterPurchase

