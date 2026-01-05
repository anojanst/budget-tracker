'use client'
import { PiggyBank, Receipt, Wallet } from 'lucide-react'

function BudgetSummary(props: { total_budget_amount: number, total_amount_spent: number, total_expense_count: number }) {
    const { total_budget_amount, total_amount_spent, total_expense_count } = props

    const remaining = total_budget_amount - total_amount_spent
    const percentage = total_budget_amount > 0 ? (total_amount_spent / total_budget_amount) * 100 : 0

    return (
        <div className='w-full border rounded-lg p-3 md:p-4 bg-card'>
            <div className="flex gap-2 items-center justify-between mb-3">
                <div className='flex gap-2 items-center'>
                    <PiggyBank size={20} className='bg-primary text-white p-2 h-10 w-10 md:h-12 md:w-12 rounded-full' />
                    <div className="flex flex-col">
                        <div className="text-lg md:text-xl font-bold">Budget Overview</div>
                        <div className="text-xs md:text-sm text-muted-foreground">{total_expense_count} Transactions</div>
                    </div>
                </div>
                <div className='text-right'>
                    <div className="text-base md:text-lg font-semibold text-primary">${total_budget_amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Budget</div>
                </div>
            </div>
            <div className='w-full mt-3'>
                <div className='flex gap-2 items-center justify-between text-gray-500 text-sm font-medium mb-2'>
                    <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-muted-foreground" />
                        <p>${total_amount_spent.toLocaleString()} spent</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Receipt size={16} className="text-muted-foreground" />
                        <p>${remaining >= 0 ? remaining.toLocaleString() : '0'} remaining</p>
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 md:h-2.5">
                    <div 
                        className={`h-full rounded-full transition-all ${
                            percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

export default BudgetSummary