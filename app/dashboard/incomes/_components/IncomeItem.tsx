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
    return (
        <div className="grid grid-cols-12 items-center gap-x-3 gap-y-1 rounded-xl bg-slate-100 p-3 my-1">
            {/* Date — mobile top-left, desktop center-ish */}
            <div className="col-span-6 text-xs text-muted-foreground md:order-4 md:col-span-2 md:text-center">
                {income.date}
            </div>

            {/* Category — mobile top-right */}
            <div className="col-span-4 justify-self-end md:order-3 md:col-span-2 md:justify-self-center">
                {/* If you use shadcn Badge, keep this; otherwise swap for a <span> */}
                <Badge className="bg-primary/90 text-primary-foreground font-medium px-2 py-0.5 text-xs whitespace-nowrap">
                    {income.category}
                </Badge>
            </div>

            {/* Delete — to the right of category on mobile */}
            <div className="col-span-2 flex justify-end md:order-5 md:col-span-1">
                <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-12"
                    aria-label={`Delete ${income.name}`}
                    onClick={() => deleteIncome(income.id, income.date, income.amount)}
                >
                    <Trash className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Name — second line left on mobile; first column on desktop */}
            <div className="col-span-7 truncate md:order-1 md:col-span-5" title={income.name}>
                {income.name}
            </div>

            {/* Amount — second line right on mobile; second column on desktop */}
            <div className="col-span-5 text-right font-semibold tabular-nums md:order-2 md:col-span-2">
                {typeof income.amount === "number"
                    ? `$${income.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `$${income.amount}.00`}
            </div>
        </div>

    )
}

export default IncomeItem