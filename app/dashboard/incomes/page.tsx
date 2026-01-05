'use client';
import React, { useEffect, useState } from 'react'
import AddIncome from './_components/AddIncome'
import { useUser } from '@clerk/nextjs';

import { eq, and, asc } from 'drizzle-orm'
import { db } from '@/utils/dbConfig';
import { Incomes } from '@/utils/schema';
import { Income } from '../_type/type';
import IncomeItem from './_components/IncomeItem';
import { Skeleton } from '@/components/ui/skeleton';
import IncomeExpenseBalanceChart from '../_components/IncomeExpenseBalanceChart';

function IncomeScreen() {
    const { user } = useUser();
    const [incomes, setIncomes] = useState<Income[]>([]);

    const fetchIncomes = async (userEmail: string) => {
        try {
            const incomes = await db
                .select({
                    id: Incomes.id,
                    name: Incomes.name,
                    amount: Incomes.amount,
                    createdBy: Incomes.createdBy,
                    date: Incomes.date,
                    category: Incomes.category,
                })
                .from(Incomes)
                .where(and(eq(Incomes.createdBy, userEmail)))
                .orderBy(asc(Incomes.date));

            setIncomes(incomes)
            return incomes;
        } catch (error) {
            console.error("Error fetching expenses:", error);
            throw new Error("Failed to fetch expenses");
        }
    }

    useEffect(() => {
        fetchIncomes(user?.primaryEmailAddress?.emailAddress!);
    }, [user]);
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)

    return (
        <div className='w-full px-2 py-3 pb-6 md:px-4 md:py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto'>
            {/* Header */}
            <div className='mb-4 md:mb-6'>
                <h1 className='font-bold text-lg md:text-xl'>My Incomes</h1>
            </div>

            {/* Income Summary and Add Income - Mobile: stacked, Desktop: side by side */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6 items-stretch'>
                {/* Add Income */}
                <div className='flex'>
                    <div className='border rounded-lg p-3 md:p-4 bg-card w-full flex flex-col'>
                        <AddIncome refreshData={() => fetchIncomes(user?.primaryEmailAddress?.emailAddress!)} />
                    </div>
                </div>
                
                {/* Income Summary */}
                <div className='flex lg:col-span-2'>
                    <div className='border rounded-lg p-3 md:p-4 bg-card w-full flex flex-col'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='flex flex-col'>
                                <span className='text-xs md:text-sm text-muted-foreground'>Total Income</span>
                                <span className='text-xl md:text-2xl font-bold text-primary'>${totalIncome.toLocaleString()}</span>
                            </div>
                            <div className='flex flex-col items-end'>
                                <span className='text-xs md:text-sm text-muted-foreground'>Entries</span>
                                <span className='text-xl md:text-2xl font-bold text-foreground'>
                                    {incomes.length}
                                </span>
                            </div>
                        </div>
                        {incomes.length > 0 && (
                            <div className='mt-auto'>
                                <IncomeExpenseBalanceChart count={incomes.length} />
                            </div>
                        )}
                    </div>
                </div>

                
            </div>

            {/* Income List */}
            <div className='border rounded-lg p-3 md:p-4 bg-card'>
                <h2 className='font-semibold text-base md:text-lg mb-3 md:mb-4'>Income History</h2>
                {incomes.length > 0 ? (
                    <div className='space-y-4'>
                        {incomes.map((income, index) => (
                            <IncomeItem key={index} income={income} refreshData={() => fetchIncomes(user?.primaryEmailAddress?.emailAddress!)} />
                        ))}
                    </div>
                ) : (
                    <div className='text-center py-8 text-muted-foreground text-sm'>
                        <p>No income entries yet. Add your first income above!</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default IncomeScreen