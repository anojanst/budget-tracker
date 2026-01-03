'use client'
import React, { useState, useEffect } from 'react'
import { db } from '@/utils/dbConfig'
import { ShoppingItems } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ShoppingItem } from '../../_type/type'

function EditShoppingItem({
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
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [uom, setUom] = useState(item.uom)
  const [needWant, setNeedWant] = useState<'need' | 'want'>(item.needWant)
  const [estimatePrice, setEstimatePrice] = useState(item.estimatePrice.toString())
  const [actualPrice, setActualPrice] = useState(item.actualPrice?.toString() || '')
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

    if (!name || !quantity || !estimatePrice) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await db
        .update(ShoppingItems)
        .set({
          name: toTitleCase(name.trim()),
          quantity: quantity, // numeric type expects string
          uom: uom || null,
          needWant: needWant,
          estimatePrice: parseInt(estimatePrice),
        })
        .where(eq(ShoppingItems.id, item.id))

      toast.success('Item updated successfully!')
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
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>Item Name</label>
            <Input
              placeholder='e.g., Milk'
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
              placeholder='e.g., 2'
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
            <label className='text-sm font-medium mb-1 block'>Estimate Price ($)</label>
            <Input
              type='number'
              placeholder='e.g., 10'
              value={estimatePrice}
              onChange={(e) => setEstimatePrice(e.target.value)}
              required
            />
          </div>
          <div className='flex gap-2'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Item'}
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

export default EditShoppingItem

