import { Loan, LoanRepayment } from '@/app/dashboard/_type/type'
import { Button } from '@/components/ui/button'
import { db } from '@/utils/dbConfig'
import { Incomes, LoanRepayments, Loans } from '@/utils/schema'
import { Trash, View } from 'lucide-react'
import React, { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { eq } from 'drizzle-orm'
import { recalcBalanceHistoryFromDate } from '@/utils/recalcBalanceHistoryFromDate'
import { useUser } from '@clerk/nextjs'
import { checkUpcomingPayments, deleteLoan, getLoanSummary, getUpcomingPaymentsForLoan, markRepaymentAsPaid } from '@/utils/loanUtils'
import { check } from 'drizzle-orm/mysql-core'
import { get } from 'http'
import { Badge } from '@/components/ui/badge'
import AddExtraPayment from './AddExtraPayment'

function IncomeItem(props: { loan: Loan, refreshData: () => void }) {
    const { loan, refreshData } = props
    const { user } = useUser()
    const [viewLoan, setViewLoan] = useState(false)
    const [upcomingPayments, setUpcomingPayments] = useState<LoanRepayment[]>([])

    const triggerDeleteLoan = async (loanId: number) => {
        await deleteLoan(loanId, user?.primaryEmailAddress?.emailAddress!)

        refreshData()
        toast(`loan has been deleted.`)
    }
    const fetchUpcomingPayments = async () => {
        const upcomingPayments = await getUpcomingPaymentsForLoan(loan.id)
        setUpcomingPayments(upcomingPayments)
    }
    const triggerPayment = async (repaymentId: number, amount: number, principalAmount: number) => {
        await markRepaymentAsPaid(repaymentId, loan.id, amount, loan.createdBy, principalAmount)
        fetchUpcomingPayments()
    }
    useEffect(() => {
        fetchUpcomingPayments()
    }, [user])
    return (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 md:p-4 hover:bg-slate-100 transition-colors">
            {/* Mobile Layout */}
            <div className="flex flex-col gap-2 md:hidden">
                <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm truncate flex-1" title={loan.lender}>
                        {loan.lender}
                    </div>
                    <div className="font-semibold text-sm tabular-nums whitespace-nowrap">
                        ${loan.principalAmount.toLocaleString()}
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{loan.tenureMonths} payments</span>
                        <span className="text-xs text-muted-foreground">Due: {loan.nextDueDate}</span>
                    </div>
                    <div className="flex gap-1.5">
                        <Button 
                            size="icon" 
                            variant="ghost"
                            className='h-7 w-7 text-primary hover:text-primary hover:bg-primary/10' 
                            onClick={() => setViewLoan(!viewLoan)}
                        >
                            <View className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="ghost"
                            className='h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10' 
                            onClick={() => triggerDeleteLoan(loan.id)}
                        >
                            <Trash className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Desktop Layout - Table-like with proper column alignment */}
            <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-4">
                {/* Lender - 4 columns */}
                <div className="col-span-4 min-w-0">
                    <div className="font-medium text-base truncate" title={loan.lender}>
                        {loan.lender}
                    </div>
                </div>

                {/* Principal - 2 columns, right-aligned */}
                <div className="col-span-2 text-right">
                    <div className="font-semibold text-base tabular-nums whitespace-nowrap">
                        ${loan.principalAmount.toLocaleString()}
                    </div>
                </div>

                {/* Tenure - 2 columns */}
                <div className="col-span-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{loan.tenureMonths} payments</span>
                </div>

                {/* Next Due Date - 2 columns */}
                <div className="col-span-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{loan.nextDueDate}</span>
                </div>

                {/* Actions - 2 columns */}
                <div className="col-span-2 flex justify-end gap-2">
                    <Button 
                        size="icon" 
                        variant="ghost"
                        className='h-8 w-8 text-primary hover:text-primary hover:bg-primary/10' 
                        onClick={() => setViewLoan(!viewLoan)}
                    >
                        <View className="h-4 w-4" />
                    </Button>
                    <Button 
                        size="icon" 
                        variant="ghost"
                        className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10' 
                        onClick={() => triggerDeleteLoan(loan.id)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Expanded View - Payment Details */}
            {viewLoan && (
                <div className='mt-4 pt-4 border-t border-slate-200'>
                    <div className='mb-3'>
                        <AddExtraPayment loanId={loan.id} refreshData={fetchUpcomingPayments} />
                    </div>
                    <div className='space-y-2'>
                        {/* Header Row - Desktop only */}
                        <div className='hidden md:grid md:grid-cols-12 md:gap-4 md:pb-2 md:border-b md:border-slate-200'>
                            <div className='col-span-3 text-xs font-semibold text-muted-foreground'>Date</div>
                            <div className='col-span-2 text-xs font-semibold text-muted-foreground text-right'>Total</div>
                            <div className='col-span-2 text-xs font-semibold text-muted-foreground text-right'>Principal</div>
                            <div className='col-span-2 text-xs font-semibold text-muted-foreground text-right'>Interest</div>
                            <div className='col-span-3 text-xs font-semibold text-muted-foreground text-right'>Status</div>
                        </div>
                        {upcomingPayments.map((payment, index) => (
                            <div key={index} className='rounded-lg bg-slate-100 p-2 md:p-3'>
                                {/* Mobile Layout for Payment */}
                                <div className="flex flex-col gap-2 md:hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">{payment.scheduledDate}</span>
                                        <span className="text-sm font-semibold">${payment.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Principal: ${payment.principalAmount.toLocaleString()}</span>
                                        <span>Interest: ${payment.interestAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-end">
                                        {payment.status === "pending" ? (
                                            <Button 
                                                size="sm"
                                                className='h-7 text-xs bg-green-600 hover:bg-green-700' 
                                                onClick={() => triggerPayment(payment.id, payment.amount, payment.principalAmount)}
                                            >
                                                Mark as Paid
                                            </Button>
                                        ) : (
                                            <Badge variant="default" className='bg-primary'>Paid</Badge>
                                        )}
                                    </div>
                                </div>
                                {/* Desktop Layout for Payment */}
                                <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-4">
                                    <div className='col-span-3 text-sm'>{payment.scheduledDate}</div>
                                    <div className='col-span-2 text-sm font-semibold text-right tabular-nums'>${payment.amount.toLocaleString()}</div>
                                    <div className='col-span-2 text-sm text-right tabular-nums'>${payment.principalAmount.toLocaleString()}</div>
                                    <div className='col-span-2 text-sm text-right tabular-nums'>${payment.interestAmount.toLocaleString()}</div>
                                    <div className='col-span-3 flex justify-end'>
                                        {payment.status === "pending" ? (
                                            <Button 
                                                size="sm"
                                                className='h-8 text-xs bg-green-600 hover:bg-green-700' 
                                                onClick={() => triggerPayment(payment.id, payment.amount, payment.principalAmount)}
                                            >
                                                Mark as Paid
                                            </Button>
                                        ) : (
                                            <Badge variant="default" className='bg-primary'>Paid</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default IncomeItem