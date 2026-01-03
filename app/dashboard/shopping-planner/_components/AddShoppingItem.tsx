'use client'
import React, { useState, useRef, useEffect } from 'react'
import { db } from '@/utils/dbConfig'
import { ShoppingItems } from '@/utils/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

function AddShoppingItem({ 
  planId, 
  refreshData
}: { 
  planId: number
  refreshData: () => void
}) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [uom, setUom] = useState('')
  const [customUom, setCustomUom] = useState('')
  const [showCustomUom, setShowCustomUom] = useState(false)
  const [needWant, setNeedWant] = useState<'need' | 'want'>('need')
  const [estimatePrice, setEstimatePrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const commonUOMs = ['kg', 'g', 'lb', 'oz', 'L', 'mL', 'piece', 'pack', 'box', 'bottle', 'can', 'bag']

  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  useEffect(() => {
    // Auto-focus name input on mount
    nameInputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalUom = showCustomUom ? customUom : (uom === '__none__' ? '' : uom)
    
    if (!name || !quantity || !estimatePrice) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await db.insert(ShoppingItems).values({
        planId: planId,
        name: toTitleCase(name.trim()),
        quantity: quantity, // numeric type expects string
        uom: finalUom || null,
        needWant: needWant,
        estimatePrice: parseInt(estimatePrice),
        isPurchased: false,
        isMovedToNext: false,
      })

      toast.success('Item added successfully!')
      setName('')
      setQuantity('1')
      setUom('')
      setCustomUom('')
      setShowCustomUom(false)
      setEstimatePrice('')
      setNeedWant('need')
      refreshData()
      // Auto-focus name input after adding item
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='mb-4 p-4 border rounded-lg bg-slate-50'>
      <form onSubmit={handleSubmit}>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='flex-1 min-w-[150px]'>
            <label className='text-sm font-medium mb-1 block'>Item Name</label>
            <Input
              ref={nameInputRef}
              placeholder='e.g., Milk'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className='w-24'>
            <label className='text-sm font-medium mb-1 block'>Quantity</label>
            <Input
              type='number'
              step='0.01'
              placeholder='2'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className='w-32'>
            <label className='text-sm font-medium mb-1 block'>UOM <span className='text-muted-foreground font-normal'>(Optional)</span></label>
            {!showCustomUom ? (
              <Select 
                value={uom || '__none__'} 
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    setShowCustomUom(true)
                    setUom('')
                  } else if (value === '__none__') {
                    setUom('')
                  } else {
                    setUom(value)
                  }
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='UOM (Optional)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__none__'>None</SelectItem>
                  {commonUOMs.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                  <SelectItem value='__custom__'>Custom</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder='Custom UOM'
                value={customUom}
                onChange={(e) => setCustomUom(e.target.value)}
                onBlur={() => {
                  if (!customUom) {
                    setShowCustomUom(false)
                  }
                }}
                autoFocus
              />
            )}
          </div>
          <div className='w-28'>
            <label className='text-sm font-medium mb-1 block'>Need/Want</label>
            <Select value={needWant} onValueChange={(value: 'need' | 'want') => setNeedWant(value)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='need'>Need</SelectItem>
                <SelectItem value='want'>Want</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='w-32'>
            <label className='text-sm font-medium mb-1 block'>Est. Price ($)</label>
            <Input
              type='number'
              placeholder='10'
              value={estimatePrice}
              onChange={(e) => setEstimatePrice(e.target.value)}
              required
            />
          </div>
          <div>
            <Button type='submit' disabled={isSubmitting} className='h-10'>
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddShoppingItem

