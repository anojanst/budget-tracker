'use client'
import React, { useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SavingGoalWithContributions } from '../../_type/type'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import { Target, Calendar, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

function SavingGoalsTimeline({ goals }: { goals: SavingGoalWithContributions[] }) {
  if (goals.length === 0) return null

  // Group goals by target date and calculate cumulative amounts needed
  const timelineData = useMemo(() => {
    // Get all unique target dates
    const dates = [...new Set(goals.map(g => g.targetDate))].sort()
    
    return dates.map((date) => {
      // Get all goals with this target date or earlier that are not completed
      const goalsByThisDate = goals.filter(g => {
        const goalDate = new Date(g.targetDate)
        const currentDate = new Date(date)
        return goalDate <= currentDate && g.progress < 100
      })
      
      // Calculate total amount needed by this date
      const totalNeeded = goalsByThisDate.reduce((sum, g) => sum + g.remainingAmount, 0)
      
      const targetDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      targetDate.setHours(0, 0, 0, 0)
      const daysRemaining = differenceInDays(targetDate, today)
      
      return {
        date,
        targetDate,
        daysRemaining,
        totalNeeded,
        goalsCount: goalsByThisDate.length,
        isPast: isPast(targetDate) && !isToday(targetDate),
        isToday: isToday(targetDate),
      }
    })
  }, [goals])

  const getStatusColor = (item: typeof timelineData[0]) => {
    if (item.totalNeeded === 0) return 'bg-green-500'
    if (item.isPast) return 'bg-red-500'
    if (item.isToday) return 'bg-yellow-500'
    if (item.daysRemaining <= 30) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const overallTotalNeeded = goals.reduce((sum, g) => sum + g.remainingAmount, 0)
  const overallTotalSaved = goals.reduce((sum, g) => sum + g.totalSaved, 0)
  const overallTotalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)

  return (
    <div className='border rounded-lg p-3 md:p-4 bg-card mb-4 md:mb-6'>
      {/* Header */}
      <div className='flex items-center gap-2 mb-4'>
        <Target className='h-4 w-4 md:h-5 md:w-5 text-muted-foreground' />
        <h2 className='font-bold text-base md:text-lg'>Saving Goals Timeline - Total Overview</h2>
      </div>

      <div>
        {/* Overall Summary */}
        <div className='mb-4 md:mb-6 pb-4 border-b'>
          <div className='flex items-center justify-between gap-2 md:gap-4 mb-4'>
            <div className='text-center flex-1'>
              <div className='text-base md:text-2xl font-bold text-red-600'>
                ${overallTotalNeeded.toLocaleString()}
              </div>
              <div className='text-xs text-muted-foreground'>Total Still Needed</div>
            </div>
            <div className='text-center flex-1'>
              <div className='text-base md:text-2xl font-bold text-green-600'>
                ${overallTotalSaved.toLocaleString()}
              </div>
              <div className='text-xs text-muted-foreground'>Total Saved</div>
            </div>
            <div className='text-center flex-1'>
              <div className='text-base md:text-2xl font-bold text-blue-600'>
                ${overallTotalTarget.toLocaleString()}
              </div>
              <div className='text-xs text-muted-foreground'>Total Target</div>
            </div>
          </div>
          <div className='w-full bg-slate-200 rounded-full h-2 md:h-3'>
            <div
              className='bg-green-500 h-2 md:h-3 rounded-full transition-all'
              style={{ width: `${Math.min((overallTotalSaved / overallTotalTarget) * 100, 100)}%` }}
            />
          </div>
          <div className='text-center mt-2 text-xs md:text-sm text-muted-foreground'>
            Overall Progress: {((overallTotalSaved / overallTotalTarget) * 100).toFixed(1)}%
          </div>
        </div>

        {/* Timeline Accordion */}
        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='timeline' className='border-none'>
            <AccordionTrigger className='py-2 hover:no-underline'>
              <span className='text-sm font-medium text-muted-foreground'>View Timeline</span>
            </AccordionTrigger>
            <AccordionContent>
              {/* Horizontal Timeline with Scroll */}
              <div className='relative pb-8 overflow-x-auto'>
                {/* Timeline line - spans full width of scrollable content */}
                <div className='absolute top-3 left-0 h-0.5 bg-slate-300 z-0' style={{ width: `${Math.max(600, timelineData.length * 150)}px` }} />
                
                {/* Timeline markers - distributed across full width with horizontal scroll */}
                <div className='relative flex items-start' style={{ width: `${Math.max(600, timelineData.length * 150)}px` }}>
                  {timelineData.map((item, index) => (
                    <div key={item.date} className='flex flex-col items-center relative' style={{ width: `${100 / timelineData.length}%`, minWidth: '150px' }}>
                      {/* Timeline marker */}
                      <div className='relative z-10 flex flex-col items-center w-full px-2'>
                        <div
                          className={`w-6 h-6 rounded-full border-2 border-white shadow-md ${getStatusColor(item)} flex-shrink-0`}
                        />
                        
                        {/* Date label */}
                        <div className='mt-2 text-center w-full'>
                          <div className='text-xs font-semibold whitespace-nowrap'>
                            {format(item.targetDate, 'dd MMM yyyy')} | {item.goalsCount} goal{item.goalsCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {/* Amount needed */}
                        <div className='mt-2 text-center w-full'>
                          <div className='text-base font-bold text-red-600 break-words'>
                            ${item.totalNeeded.toLocaleString()}
                          </div>
                        </div>
                        
                        {/* Status badge */}
                        <div className='mt-2'>
                          {item.totalNeeded === 0 ? (
                            <Badge className='bg-green-500 text-xs whitespace-nowrap'>All Met</Badge>
                          ) : item.isPast ? (
                            <Badge variant='destructive' className='text-xs whitespace-nowrap'>Overdue</Badge>
                          ) : item.isToday ? (
                            <Badge className='bg-yellow-500 text-xs whitespace-nowrap'>Due Today</Badge>
                          ) : item.daysRemaining > 0 ? (
                            <Badge variant='outline' className='text-xs whitespace-nowrap'>
                              {item.daysRemaining}d left
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

export default SavingGoalsTimeline

