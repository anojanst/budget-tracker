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
    return (
        <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
            <div className='flex justify-between pb-3'>
                <h1 className='font-bold text-xl'>My Incomes</h1>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mt-4'>
                <div className='col-span-1'>
                    <AddIncome refreshData={() => fetchIncomes(user?.primaryEmailAddress?.emailAddress!)} />
                    {incomes.length > 0 && <IncomeExpenseBalanceChart count={incomes.length} />}
                </div>
                <div className='col-span-1 md:col-span-2 border rounded-lg p-3'>
                    <h2 className='font-semibold'>Latest Income</h2>
                    {incomes.length > 0 ? incomes.map((income, index) => (
                        <IncomeItem key={index} income={income} refreshData={() => fetchIncomes(user?.primaryEmailAddress?.emailAddress!)} />
                    )) : <Skeleton className='h-10 w-full' />}
                </div>

            </div>
        </div>
    )
}

export default IncomeScreen