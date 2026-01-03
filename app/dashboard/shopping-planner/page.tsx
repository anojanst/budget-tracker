'use client'
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/utils/dbConfig'
import { ShoppingPlans, ShoppingItems } from '@/utils/schema'
import { eq, and, or, desc, asc } from 'drizzle-orm'
import { ShoppingPlanWithItems } from '../_type/type'
import ShoppingPlanList from './_components/ShoppingPlanList'
import CreateShoppingPlan from './_components/CreateShoppingPlan'
import { format } from 'date-fns'

function ShoppingPlannerPage() {
  const { user } = useUser()
  const [currentPlan, setCurrentPlan] = useState<ShoppingPlanWithItems | null>(null)
  const [completedPlans, setCompletedPlans] = useState<ShoppingPlanWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPlans()
    }
  }, [user])

  const fetchPlans = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return
    
    setLoading(true)
    try {
      // Get all current plans (not completed)
      const currentPlans = await db
        .select()
        .from(ShoppingPlans)
        .where(
          and(
            eq(ShoppingPlans.createdBy, user.primaryEmailAddress.emailAddress),
            or(
              eq(ShoppingPlans.status, 'draft'),
              eq(ShoppingPlans.status, 'ready'),
              eq(ShoppingPlans.status, 'shopping'),
              eq(ShoppingPlans.status, 'post_shopping')
            )
          )
        )
        .orderBy(desc(ShoppingPlans.id))

      // Group plans by date and calculate plan numbers
      const plansByDate = new Map<string, typeof currentPlans[0][]>()
      currentPlans.forEach(plan => {
        const dateKey = plan.planDate
        if (!plansByDate.has(dateKey)) {
          plansByDate.set(dateKey, [])
        }
        plansByDate.get(dateKey)!.push(plan)
      })

      // Sort plans within each date group by id (creation order)
      plansByDate.forEach((plans, date) => {
        plans.sort((a, b) => a.id - b.id)
      })

      const currentPlansData = await Promise.all(
        currentPlans.map(async (plan) => {
          const items = await db
            .select()
            .from(ShoppingItems)
            .where(eq(ShoppingItems.planId, plan.id))
            .orderBy(desc(ShoppingItems.id))

          const totalEstimate = items.reduce((sum, item) => sum + item.estimatePrice, 0)
          const totalActual = items
            .filter(item => item.actualPrice !== null)
            .reduce((sum, item) => sum + (parseFloat(item.actualPrice?.toString() || '0') || 0), 0)

          // Calculate plan number for this date
          const plansForDate = plansByDate.get(plan.planDate) || []
          const planNumber = plansForDate.findIndex(p => p.id === plan.id) + 1

          return {
            ...plan,
            items: items.map(item => ({
              ...item,
              quantity: parseFloat(item.quantity.toString()),
              actualPrice: item.actualPrice ? parseFloat(item.actualPrice.toString()) : null,
            })),
            totalEstimate,
            totalActual,
            planNumber,
          }
        })
      )

      // Get the most recent plan as current (or first one if multiple)
      const currentPlanData = currentPlansData.length > 0 ? currentPlansData[0] : null

      // Get completed plans - order by most recent first (by id, which reflects creation order)
      const completed = await db
        .select()
        .from(ShoppingPlans)
        .where(
          and(
            eq(ShoppingPlans.createdBy, user.primaryEmailAddress.emailAddress),
            eq(ShoppingPlans.status, 'completed')
          )
        )
        .orderBy(desc(ShoppingPlans.id))

      // Group completed plans by date for numbering
      const completedPlansByDate = new Map<string, typeof completed>()
      completed.forEach(plan => {
        const dateKey = plan.planDate
        if (!completedPlansByDate.has(dateKey)) {
          completedPlansByDate.set(dateKey, [])
        }
        completedPlansByDate.get(dateKey)!.push(plan)
      })

      // Sort plans within each date group by id (creation order)
      completedPlansByDate.forEach((plans, date) => {
        plans.sort((a, b) => a.id - b.id)
      })

      const completedPlansData = await Promise.all(
        completed.map(async (plan) => {
          const items = await db
            .select()
            .from(ShoppingItems)
            .where(eq(ShoppingItems.planId, plan.id))
            .orderBy(desc(ShoppingItems.id))

          const totalEstimate = items.reduce((sum, item) => sum + item.estimatePrice, 0)
          const totalActual = items
            .filter(item => item.actualPrice !== null)
            .reduce((sum, item) => sum + (parseFloat(item.actualPrice?.toString() || '0') || 0), 0)

          const difference = totalActual - totalEstimate
          let verdict: "under_budget" | "on_budget" | "over_budget" = "on_budget"
          if (difference < -50) verdict = "under_budget"
          else if (difference > 50) verdict = "over_budget"

          // Calculate plan number for this date
          const plansForDate = completedPlansByDate.get(plan.planDate) || []
          const planNumber = plansForDate.findIndex(p => p.id === plan.id) + 1

          return {
            ...plan,
            items: items.map(item => ({
              ...item,
              quantity: parseFloat(item.quantity.toString()),
              actualPrice: item.actualPrice ? parseFloat(item.actualPrice.toString()) : null,
            })),
            totalEstimate,
            totalActual,
            verdict,
            planNumber,
          }
        })
      )

      setCurrentPlan(currentPlanData)
      setCompletedPlans(completedPlansData)
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className='flex justify-between pb-3 border-b-2 border-b-slate-100'>
        <h1 className='font-bold text-3xl'>Shopping Planner</h1>
        {!currentPlan && (
          <CreateShoppingPlan refreshData={fetchPlans} />
        )}
      </div>

      {loading ? (
        <div className='mt-6'>Loading...</div>
      ) : (
        <>
          {currentPlan ? (
            <ShoppingPlanList 
              plan={currentPlan} 
              refreshData={fetchPlans}
              isCurrentPlan={true}
            />
          ) : (
            <div className='mt-6 text-center text-muted-foreground'>
              <p>No active shopping plan. Create one to get started!</p>
            </div>
          )}

          {completedPlans.length > 0 && (
            <div className='mt-8'>
              <h2 className='font-bold text-2xl mb-4'>History</h2>
              <div className='space-y-4'>
                {completedPlans.map((plan) => (
                  <ShoppingPlanList 
                    key={plan.id} 
                    plan={plan} 
                    refreshData={fetchPlans}
                    isCurrentPlan={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ShoppingPlannerPage

