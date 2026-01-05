import { Expense } from '@/app/dashboard/_type/type'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { db } from '@/utils/dbConfig'
import { Expenses } from '@/utils/schema'
import { Trash } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { eq } from 'drizzle-orm'
import { recalcBalanceHistoryFromDate } from '@/utils/recalcBalanceHistoryFromDate'
import { useUser } from '@clerk/nextjs'
import { deleteExpense } from '@/utils/expenseUtil'

function ExpenseItem(props: { expense: Expense, refreshData: () => void }) {
    const { expense, refreshData } = props
    const { user } = useUser()

    const triggerDelete = async (expenseId: number, date: string, amount: number) => {
        const result = await deleteExpense(expenseId, date, amount, user?.primaryEmailAddress?.emailAddress!)

        refreshData()
        toast(`Expense has been deleted.`)
    }

    const formattedAmount = typeof expense.amount === "number"
        ? `$${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${expense.amount}.00`

    return (
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 p-3 hover:bg-slate-100 transition-colors">
            {/* Expense Name - Takes most space */}
            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm md:text-base truncate" title={expense.name}>
                    {expense.name}
                </div>
                {/* Mobile: Show date and tag below name */}
                <div className="flex items-center gap-2 mt-1 md:hidden">
                    <span className="text-xs text-muted-foreground">{expense.date}</span>
                    {expense.tagName ? (
                        <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                            {expense.tagName}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs px-1.5 py-0.5">
                            No Tag
                        </Badge>
                    )}
                </div>
            </div>

            {/* Amount - Always visible, prominent */}
            <div className="font-semibold text-sm md:text-base tabular-nums text-right whitespace-nowrap">
                {formattedAmount}
            </div>

            {/* Desktop: Date and Tag */}
            <div className="hidden md:flex md:items-center md:gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{expense.date}</span>
                {expense.tagName ? (
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 whitespace-nowrap">
                        {expense.tagName}
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs px-2 py-0.5 whitespace-nowrap">
                        No Tag
                    </Badge>
                )}
            </div>

            {/* Delete Button */}
            <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                aria-label={`Delete ${expense.name}`}
                onClick={() => triggerDelete(expense.id, expense.date, expense.amount)}
            >
                <Trash className="h-4 w-4" />
            </Button>
        </div>
    )
}

export default ExpenseItem