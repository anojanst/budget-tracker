'use client'
import { PiggyBank, Receipt, Wallet } from 'lucide-react'

function BudgetSummary(props: { total_budget_amount: number, total_amount_spent: number, total_expense_count: number }) {
    const { total_budget_amount, total_amount_spent, total_expense_count } = props

    return (
        <div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                <div className='col-span-1 border rounded-lg p-4 flex gap-2 items-center justify-between'>
                    <div>
                        <p>Total Budget</p>
                        <h2 className='font-semibold text-3xl'>$ {total_budget_amount}.00</h2>
                    </div>
                    <div>
                        <PiggyBank size={16} className='bg-primary text-white p-3 h-12 w-12 rounded-full' />
                    </div>
                </div>
                <div className='col-span-1 border rounded-lg p-4 flex gap-2 items-center justify-between'>
                    <div>
                        <p>Total Spent</p>
                        <h2 className='font-semibold text-3xl'>$ {total_amount_spent}.00</h2>
                    </div>
                    <div>
                        <Wallet size={16} className='bg-primary text-white p-3 h-12 w-12 rounded-full' />
                    </div>
                </div>
                <div className='col-span-1 border rounded-lg p-4 flex gap-2 items-center justify-between'>
                    <div>
                        <p>Total Transactions</p>
                        <h2 className='font-semibold text-3xl'>{total_expense_count}</h2>
                    </div>
                    <div>
                        <Receipt size={16} className='bg-primary text-white p-3 h-12 w-12 rounded-full' />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BudgetSummary