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

    return (
        <div className="grid grid-cols-12 items-center gap-x-3 gap-y-1 rounded-xl bg-slate-100 p-3 my-1">
            {/* Date — mobile top-left, desktop center column */}
            <div className="col-span-7 text-sm text-muted-foreground md:order-3 md:col-span-2 md:text-center">
                {expense.date}
            </div>

            {/* Tag — mobile top-right */}
            <div className="col-span-3 justify-self-end md:order-4 md:col-span-2 md:text-center">
                <Badge className="bg-primary text-primary-foreground font-medium px-2 py-0.5 text-xs whitespace-nowrap">
                    {expense.tagName}
                </Badge>
            </div>

            {/* Delete — mobile next to tag (far right) */}
            <div className="col-span-2 flex justify-end md:order-5 md:col-span-1">
                <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-12"
                    aria-label={`Delete ${expense.name}`}
                    onClick={() => triggerDelete(expense.id, expense.date, expense.amount)}
                >
                    <Trash className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Name — mobile second line left, desktop first */}
            <div className="col-span-7 truncate md:order-1 md:col-span-5" title={expense.name}>
                {expense.name}
            </div>

            {/* Amount — mobile second line right, desktop second */}
            <div className="col-span-5 text-right font-semibold tabular-nums md:order-2 md:col-span-2">
                {typeof expense.amount === "number"
                    ? `$${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `$${expense.amount}.00`}
            </div>
        </div>
    )
}

export default ExpenseItem