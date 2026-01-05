'use client'
import { Budget } from '@/app/dashboard/_type/type'
import { Progress } from '@/components/ui/progress'
import EditBudget from './EditBudget'
import DeleteBudget from './DeteleBudget'

function BudgetSummary(props: { budget: Budget, refreshData: () => void }) {
  const { budget, refreshData } = props

  return (
    <div className='border rounded-lg p-3 md:p-4 bg-card h-full flex flex-col'>
      {/* Header with Budget Name, Icon, and Actions */}
      <div className='flex items-center justify-between gap-2 mb-4'>
        <div className='flex items-center gap-2 md:gap-3 min-w-0 flex-1'>
          {budget && (
            <div className='text-xl md:text-3xl flex-shrink-0'>{budget.icon}</div>
          )}
          <h1 className='font-bold text-base md:text-xl truncate'>{budget?.name || 'Loading...'}</h1>
        </div>
        <div className='flex gap-1.5 md:gap-2 flex-shrink-0'>
          <EditBudget budget={budget} refreshData={refreshData} />
          <DeleteBudget budgetId={budget.id} />
        </div>
      </div>

      {/* Budget Summary Stats */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex flex-col'>
          <span className='text-xs md:text-sm text-muted-foreground'>Total Budget</span>
          <span className='text-xl md:text-2xl font-bold text-primary'>${budget.amount.toLocaleString()}</span>
        </div>
        <div className='flex flex-col items-end'>
          <span className='text-xs md:text-sm text-muted-foreground'>Spent</span>
          <span className={`text-xl md:text-2xl font-bold ${budget.totalSpent > budget.amount ? 'text-red-600' : 'text-foreground'}`}>
            ${budget.totalSpent.toLocaleString()}
          </span>
        </div>
      </div>
      <div className='mb-2'>
        <div className='flex items-center justify-between text-xs md:text-sm text-muted-foreground mb-1'>
          <span>{budget.expenseCount} {budget.expenseCount === 1 ? 'expense' : 'expenses'}</span>
          <span className={budget.amount - budget.totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${Math.abs(budget.amount - budget.totalSpent).toLocaleString()} {budget.amount - budget.totalSpent >= 0 ? 'remaining' : 'over budget'}
          </span>
        </div>
        <Progress 
          value={budget.amount > 0 ? Math.min((budget.totalSpent / budget.amount) * 100, 100) : 0} 
          className={`h-2 md:h-2.5 ${budget.totalSpent > budget.amount ? 'bg-red-200' : ''}`}
        />
      </div>
    </div>
  )
}

export default BudgetSummary

