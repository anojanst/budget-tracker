import { Expense, Income } from '@/app/dashboard/_type/type'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { db } from '@/utils/dbConfig'
import { Incomes } from '@/utils/schema'
import { Trash } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { eq } from 'drizzle-orm'
import { recalcBalanceHistoryFromDate } from '@/utils/recalcBalanceHistoryFromDate'
import { useUser } from '@clerk/nextjs'

function IncomeItem(props: { income: Income, refreshData: () => void }) {
    const { income, refreshData } = props
    const { user } = useUser()

    const deleteIncome = async (incomeId: number, date: string, amount: number) => {
        const result = await db.delete(Incomes).where(eq(Incomes.id, incomeId)).returning()
        if (result) {
            recalcBalanceHistoryFromDate(user?.primaryEmailAddress?.emailAddress!, date, amount, "income", "deduct");
            refreshData()
            toast(`Income has been deleted.`)
        }
    }
    const formattedAmount = typeof income.amount === "number"
        ? `$${income.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${income.amount}.00`

    return (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 md:p-4 hover:bg-slate-100 transition-colors">
            {/* Mobile Layout */}
            <div className="flex flex-col gap-2 md:hidden">
                <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm truncate flex-1" title={income.name}>
                        {income.name}
                    </div>
                    <div className="font-semibold text-sm tabular-nums whitespace-nowrap">
                        {formattedAmount}
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{income.date}</span>
                        <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                            {income.category}
                        </Badge>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        aria-label={`Delete ${income.name}`}
                        onClick={() => deleteIncome(income.id, income.date, income.amount)}
                    >
                        <Trash className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Desktop Layout - Table-like with proper column alignment */}
            <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-4">
                {/* Name - 5 columns */}
                <div className="col-span-5 min-w-0">
                    <div className="font-medium text-base truncate" title={income.name}>
                        {income.name}
                    </div>
                </div>

                {/* Amount - 2 columns, right-aligned */}
                <div className="col-span-2 text-right">
                    <div className="font-semibold text-base tabular-nums whitespace-nowrap">
                        {formattedAmount}
                    </div>
                </div>

                {/* Date - 2 columns */}
                <div className="col-span-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{income.date}</span>
                </div>

                {/* Category - 2 columns */}
                <div className="col-span-2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 whitespace-nowrap">
                        {income.category}
                    </Badge>
                </div>

                {/* Delete Button - 1 column */}
                <div className="col-span-1 flex justify-end">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Delete ${income.name}`}
                        onClick={() => deleteIncome(income.id, income.date, income.amount)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default IncomeItem