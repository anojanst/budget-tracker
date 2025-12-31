'use client'
import React, { useState } from 'react'
import { ShoppingItem as ShoppingItemType, ShoppingPlanWithItems } from '../../_type/type'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import EditShoppingItem from './EditShoppingItem'
import PurchaseItemDialog from './PurchaseItemDialog'
import AddPriceDialog from './AddPriceDialog'
import AddItemAfterPurchase from './AddItemAfterPurchase'
import MoveToNextPlanDialog from './MoveToNextPlanDialog'
import { Edit, CheckCircle2, ArrowRight, ShoppingCart, ArrowRightCircle, DollarSign } from 'lucide-react'
import { db } from '@/utils/dbConfig'
import { ShoppingItems } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import { toast } from 'sonner'

function ShoppingItemComponent({
  item,
  plan,
  refreshData,
  isCurrentPlan,
}: {
  item: ShoppingItemType
  plan: ShoppingPlanWithItems
  refreshData: () => void
  isCurrentPlan: boolean
}) {
  const [showEdit, setShowEdit] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)
  const [showAddPrice, setShowAddPrice] = useState(false)
  const [showAddAfterPurchase, setShowAddAfterPurchase] = useState(false)
  const [showMove, setShowMove] = useState(false)
  const [isMarkingPurchased, setIsMarkingPurchased] = useState(false)

  const handleMarkAsPurchased = async () => {
    if (plan.status === 'shopping') {
      // Direct mark as purchased without dialog during shopping
      setIsMarkingPurchased(true)
      try {
        await db
          .update(ShoppingItems)
          .set({
            isPurchased: true,
            actualPrice: null, // No price during shopping
          })
          .where(eq(ShoppingItems.id, item.id))

        toast.success(`${item.name} marked as purchased!`)
        refreshData()
      } catch (error) {
        console.error('Error marking item as purchased:', error)
        toast.error('Failed to mark item as purchased')
      } finally {
        setIsMarkingPurchased(false)
      }
    } else {
      // Show dialog for other statuses
      setShowPurchase(true)
    }
  }

  return (
    <>
      <Card className={`p-3 h-full flex flex-col ${item.isOutOfPlan ? 'border-2 border-purple-300 bg-purple-50' : ''}`}>
        <div className='flex items-start justify-between gap-2 mb-2'>
          <div className='flex-1 min-w-0'>
            <h4 className='font-semibold truncate mb-1'>{item.name}</h4>
            
          </div>
          <div className='flex items-start gap-1 flex-shrink-0'>
            {item.isPurchased && (
              <Badge className={item.isOutOfPlan ? 'bg-purple-500 text-xs' : 'bg-green-500 text-xs'}>
                <CheckCircle2 className='h-3 w-3 mr-1' />
                {item.isOutOfPlan ? 'Out of Plan' : 'Purchased'}
              </Badge>
            )}
            {item.isMovedToNext && (
              <Badge variant='outline' className='text-xs'>
                <ArrowRight className='h-3 w-3 mr-1' />
                Moved
              </Badge>
            )}
            {isCurrentPlan && !item.isMovedToNext && (
              <div className='flex gap-1'>
                {/* Draft: Can edit, move, purchase (with dialog) */}
                {plan.status === 'draft' && !item.isPurchased && (
                  <>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setShowPurchase(true)}
                      className='h-7 w-7'
                      title='Mark as purchased'
                    >
                      <ShoppingCart className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setShowMove(true)}
                      className='h-7 w-7'
                      title='Move to next plan'
                    >
                      <ArrowRightCircle className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setShowEdit(true)}
                      className='h-7 w-7'
                      title='Edit item'
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                  </>
                )}
                {/* Ready: Can only view */}
                {plan.status === 'ready' && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setShowEdit(true)}
                    className='h-7 w-7'
                    title='Edit item'
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                )}
                {/* Shopping: Can mark as purchased (no price) - direct action, no dialog */}
                {plan.status === 'shopping' && !item.isPurchased && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={handleMarkAsPurchased}
                    disabled={isMarkingPurchased}
                    className='h-7 w-7'
                    title='Mark as purchased'
                  >
                    <ShoppingCart className='h-4 w-4' />
                  </Button>
                )}
                {/* Post Shopping: No individual price edit - use bulk add */}
              </div>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap overflow-x-auto'>
              <span>
                <span className='font-medium'>{item.quantity}{item.uom ? ` ${item.uom}` : ''}</span>
              </span>
              <span>|</span>
              <span>
                <span className='font-medium'>Est: ${item.estimatePrice.toFixed(2)}</span>
              </span>
              {plan.status !== 'post_shopping' && (
                <>
                  <span>|</span>
                  <Badge variant={item.needWant === 'need' ? 'default' : 'destructive'} className='text-xs whitespace-nowrap'>
                    {item.needWant === 'need' ? 'Need' : 'Want'}
                  </Badge>
                </>
              )}
              {item.actualPrice !== null && (
                <>
                  <span>|</span>
                  <span className='whitespace-nowrap'>
                    <span className='font-medium'>Act: </span>
                    <span className={item.actualPrice > item.estimatePrice ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                      ${item.actualPrice.toFixed(2)}
                    </span>
                  </span>
                </>
              )}
              {item.isPurchased && item.actualPrice === null && (
                <>
                  <span>|</span>
                  <span className='italic text-muted-foreground whitespace-nowrap'>
                    Price not added yet
                  </span>
                </>
              )}
            </div>
      </Card>

      {showEdit && (
        <EditShoppingItem
          item={item}
          planId={plan.id}
          onClose={() => setShowEdit(false)}
          refreshData={refreshData}
        />
      )}

      {showPurchase && (
        <PurchaseItemDialog
          item={item}
          planId={plan.id}
          onClose={() => setShowPurchase(false)}
          refreshData={refreshData}
        />
      )}

      {showAddPrice && (
        <AddPriceDialog
          item={item}
          planId={plan.id}
          onClose={() => setShowAddPrice(false)}
          refreshData={refreshData}
        />
      )}

      {showMove && (
        <MoveToNextPlanDialog
          item={item}
          planId={plan.id}
          onClose={() => setShowMove(false)}
          refreshData={refreshData}
        />
      )}
    </>
  )
}

export default ShoppingItemComponent

