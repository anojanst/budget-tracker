'use client'
import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/utils/dbConfig'
import { ShoppingPlans } from '@/utils/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'

function CreateShoppingPlan({ refreshData }: { refreshData: () => void }) {
  const { user } = useUser()
  const [planDate, setPlanDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isCreating, setIsCreating] = useState(false)

  const createPlan = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return

    setIsCreating(true)
    try {
      await db.insert(ShoppingPlans).values({
        createdBy: user.primaryEmailAddress.emailAddress,
        planDate: planDate,
        status: 'draft',
      })

      toast.success('Shopping plan created successfully!')
      refreshData()
    } catch (error) {
      console.error('Error creating plan:', error)
      toast.error('Failed to create shopping plan')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <Input
        type='date'
        value={planDate}
        onChange={(e) => setPlanDate(e.target.value)}
        className='w-auto'
      />
      <Button onClick={createPlan} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Plan'}
      </Button>
    </div>
  )
}

export default CreateShoppingPlan

