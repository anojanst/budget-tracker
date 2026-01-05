'use client'
import React, { useState } from 'react'
import { ShoppingPlanWithItems } from '../../_type/type'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ShoppingItemComponent from './ShoppingItem'
import AddShoppingItem from './AddShoppingItem'
import AddItemAfterPurchase from './AddItemAfterPurchase'
import { ShoppingCart, CheckCircle2, XCircle, DollarSign } from 'lucide-react'
import CompletePlanDialog from './CompletePlanDialog'
import MarkTripCompleteDialog from './MarkTripCompleteDialog'
import MarkAsFinalDialog from './MarkAsFinalDialog'
import BulkAddPricesDialog from './BulkAddPricesDialog'
import BulkAddItemsDialog from './BulkAddItemsDialog'
import { db } from '@/utils/dbConfig'
import { ShoppingPlans } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { toast } from 'sonner'

function ShoppingPlanList({ 
  plan, 
  refreshData, 
  isCurrentPlan 
}: { 
  plan: ShoppingPlanWithItems
  refreshData: () => void
  isCurrentPlan: boolean
}) {
  const [showAddAfterPurchase, setShowAddAfterPurchase] = useState(false)
  const [showBulkAddPrices, setShowBulkAddPrices] = useState(false)
  const [showBulkAddItems, setShowBulkAddItems] = useState(false)

  const purchasedItems = plan.items.filter(item => item.isPurchased && !item.isOutOfPlan)
  const outOfPlanItems = plan.items.filter(item => item.isOutOfPlan)
  const unpurchasedItems = plan.items.filter(item => !item.isPurchased && !item.isMovedToNext)
  const movedItems = plan.items.filter(item => item.isMovedToNext)

  const getStatusBadge = () => {
    switch (plan.status) {
      case 'draft':
        return <Badge variant='secondary'>Draft</Badge>
      case 'ready':
        return <Badge className='bg-blue-500'>Ready</Badge>
      case 'shopping':
        return <Badge className='bg-orange-500'>Shopping</Badge>
      case 'post_shopping':
        return <Badge className='bg-yellow-500'>Post Shopping</Badge>
      case 'completed':
        return <Badge variant='default'>Completed</Badge>
      default:
        return <Badge variant='secondary'>{plan.status}</Badge>
    }
  }

  const getVerdictBadge = () => {
    if (!plan.verdict) return null
    
    switch (plan.verdict) {
      case 'under_budget':
        return <Badge className='bg-green-500'>Under Budget</Badge>
      case 'on_budget':
        return <Badge className='bg-blue-500'>On Budget</Badge>
      case 'over_budget':
        return <Badge className='bg-red-500'>Over Budget</Badge>
    }
  }

  return (
    <div className='border rounded-lg p-3 md:p-4 bg-card mb-4 md:mb-6'>
      {/* Header */}
      <div className='flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2 flex-wrap'>
          <div className='flex items-center gap-2'>
            <ShoppingCart className='h-4 w-4 md:h-5 md:w-5 text-muted-foreground' />
            <h2 className='font-bold text-base md:text-lg'>
              Shopping Plan {plan.planNumber || 1} ({format(new Date(plan.planDate), 'MMM dd, yyyy')})
            </h2>
          </div>
          <div className='flex items-center gap-2'>
            {getStatusBadge()}
            {plan.verdict && getVerdictBadge()}
          </div>
        </div>
        {isCurrentPlan && (
          <div className='flex flex-wrap gap-2'>
            {plan.status === 'draft' && plan.items.length > 0 && (
              <CompletePlanDialog planId={plan.id} refreshData={refreshData} />
            )}
            {plan.status === 'ready' && (
              <Button 
                variant='default'
                size='sm'
                className='h-8 md:h-9'
                onClick={async () => {
                  try {
                    await db.update(ShoppingPlans).set({ status: 'shopping' }).where(eq(ShoppingPlans.id, plan.id))
                    toast.success('Shopping started!')
                    refreshData()
                  } catch (error) {
                    console.error('Error starting shopping:', error)
                    toast.error('Failed to start shopping')
                  }
                }}
              >
                Start Shopping
              </Button>
            )}
            {plan.status === 'shopping' && (
              <MarkTripCompleteDialog planId={plan.id} refreshData={refreshData} />
            )}
            {plan.status === 'post_shopping' && (
              <>
                {purchasedItems.length > 0 && (
                  <Button 
                    variant='default'
                    size='sm'
                    className='h-8 md:h-9'
                    onClick={() => setShowBulkAddPrices(true)}
                  >
                    Bulk Add Prices
                  </Button>
                )}
                <Button 
                  variant='outline'
                  size='sm'
                  className='h-8 md:h-9'
                  onClick={() => setShowAddAfterPurchase(true)}
                >
                  Add Out of Plan
                </Button>
                <MarkAsFinalDialog planId={plan.id} refreshData={refreshData} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {isCurrentPlan && (plan.status === 'draft' || plan.status === 'ready') && (
          <div className='mb-4 md:mb-6'>
            {plan.status === 'draft' ? (
              <div className='border rounded-lg p-3 md:p-4 bg-slate-50'>
                <div className='flex gap-2 mb-3'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-8 md:h-9'
                    onClick={() => setShowBulkAddItems(true)}
                  >
                    Bulk Add Items
                  </Button>
                </div>
                <AddShoppingItem 
                  planId={plan.id} 
                  refreshData={refreshData}
                />
              </div>
            ) : (
              <div className='p-4 border rounded-lg bg-slate-50 text-center text-muted-foreground text-sm md:text-base'>
                Plan is ready for shopping. Click "Start Shopping" to begin.
              </div>
            )}
          </div>
        )}

        {showAddAfterPurchase && (
          <AddItemAfterPurchase
            planId={plan.id}
            onClose={() => setShowAddAfterPurchase(false)}
            refreshData={refreshData}
          />
        )}

        {showBulkAddPrices && (
          <BulkAddPricesDialog
            items={purchasedItems}
            planId={plan.id}
            onClose={() => setShowBulkAddPrices(false)}
            refreshData={refreshData}
          />
        )}

        {showBulkAddItems && (
          <BulkAddItemsDialog
            planId={plan.id}
            onClose={() => setShowBulkAddItems(false)}
            refreshData={refreshData}
          />
        )}

        {/* Summary Section */}
        <div className='mb-4 md:mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100'>
            <div className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0' />
              <div>
                <p className='text-xs md:text-sm text-muted-foreground'>Estimated Total</p>
                <p className='font-semibold text-sm md:text-base'>${plan.totalEstimate.toFixed(2)}</p>
              </div>
            </div>
            <div className='flex items-center justify-between md:justify-end gap-4'>
              <div className='text-left md:text-right'>
                <p className='text-xs md:text-sm text-muted-foreground'>To Purchase</p>
                <p className='font-semibold text-sm md:text-base'>{unpurchasedItems.length} items</p>
              </div>
              {(plan.status === 'completed' || plan.totalActual > 0) && (
                <div className='flex items-center gap-2 md:pl-4 md:border-l'>
                  <DollarSign className='h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0' />
                  <div>
                    <p className='text-xs md:text-sm text-muted-foreground'>Actual Total</p>
                    <p className='font-semibold text-sm md:text-base'>${plan.totalActual.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {unpurchasedItems.length > 0 && (
          <div className='mb-4 md:mb-6'>
            <h3 className='font-semibold text-sm md:text-base mb-3 flex items-center gap-2'>
              <XCircle className='h-4 w-4 text-orange-500' />
              To Purchase ({unpurchasedItems.length})
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4'>
              {unpurchasedItems.map((item) => (
                <ShoppingItemComponent
                  key={item.id}
                  item={item}
                  plan={plan}
                  refreshData={refreshData}
                  isCurrentPlan={isCurrentPlan}
                />
              ))}
            </div>
          </div>
        )}

        {purchasedItems.length > 0 && (
          <div className='mb-4 md:mb-6'>
            <h3 className='font-semibold text-sm md:text-base mb-3 flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4 text-green-500' />
              Purchased ({purchasedItems.length})
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4'>
              {purchasedItems.map((item) => (
                <ShoppingItemComponent
                  key={item.id}
                  item={item}
                  plan={plan}
                  refreshData={refreshData}
                  isCurrentPlan={isCurrentPlan}
                />
              ))}
            </div>
          </div>
        )}

        {outOfPlanItems.length > 0 && (
          <div className='mb-4 md:mb-6'>
            <h3 className='font-semibold text-sm md:text-base mb-3 flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4 text-purple-500' />
              Out of Plan ({outOfPlanItems.length})
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4'>
              {outOfPlanItems.map((item) => (
                <ShoppingItemComponent
                  key={item.id}
                  item={item}
                  plan={plan}
                  refreshData={refreshData}
                  isCurrentPlan={isCurrentPlan}
                />
              ))}
            </div>
          </div>
        )}

        {movedItems.length > 0 && (
          <div className='mb-4 md:mb-6'>
            <h3 className='font-semibold text-sm md:text-base mb-3 text-muted-foreground'>
              Moved to Next Plan ({movedItems.length})
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4'>
              {movedItems.map((item) => (
                <ShoppingItemComponent
                  key={item.id}
                  item={item}
                  plan={plan}
                  refreshData={refreshData}
                  isCurrentPlan={isCurrentPlan}
                />
              ))}
            </div>
          </div>
        )}

        {plan.items.length === 0 && (
          <div className='text-center text-muted-foreground py-8 text-sm md:text-base'>
            <p>No items in this plan yet. Add your first item!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShoppingPlanList

