'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/utils/dbConfig';
import { Loans } from '@/utils/schema';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { format, set } from "date-fns";
import { addLoanWithRepayments } from '@/utils/loanUtils';

function AddLoan(props: { refreshData: () => void }) {
    const { refreshData } = props;
    const { user } = useUser();
    
    const [lender, setLender] = useState('');
    const [amount, setAmount] = useState(0);
    const [interestRate, setInterestRate] = useState(0);
    const [tenure, setTenure] = useState(12); // Default: 12 months
    const [repaymentFrequency, setRepaymentFrequency] = useState<string>("monthly");
    const [nextDueDate, setNextDueDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    const saveLoan = async () => {
        if (!user?.primaryEmailAddress?.emailAddress) return;

        await addLoanWithRepayments(
            user.primaryEmailAddress.emailAddress,
            lender,
            amount,
            interestRate,
            tenure,
            repaymentFrequency as "monthly" | "bimonthly" | "weekly",
            nextDueDate
        );

        refreshData();
        toast(`Loan has been added.`);
        
        // Reset fields
        setLender('');
        setAmount(0);
        setInterestRate(0);
        setTenure(12);
        setRepaymentFrequency("monthly");
        setNextDueDate(format(new Date(), 'yyyy-MM-dd'));
    };

    return (
        <div>
            <h2 className='font-semibold text-sm md:text-base mb-3'>Add Loan</h2>
            <div className='space-y-3'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Lender - Eg: Bank XYZ' 
                            value={lender} 
                            className='h-9 md:h-10' 
                            onChange={(e) => setLender(e.target.value)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Loan Amount - Eg: 5000' 
                            value={amount} 
                            type='number' 
                            className='h-9 md:h-10' 
                            min={0} 
                            onChange={(e) => setAmount(parseInt(e.target.value) || 0)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Interest Rate (%) - Eg: 5.5' 
                            value={interestRate} 
                            type='number' 
                            className='h-9 md:h-10' 
                            min={0} 
                            step="0.1" 
                            onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Tenure (Months) - Eg: 24' 
                            value={tenure} 
                            type='number' 
                            className='h-9 md:h-10' 
                            min={1} 
                            onChange={(e) => setTenure(parseInt(e.target.value) || 12)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Select value={repaymentFrequency} onValueChange={setRepaymentFrequency}>
                            <SelectTrigger className="h-9 md:h-10">
                                <SelectValue placeholder="Repayment Frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="bimonthly">Bimonthly</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Next Due Date' 
                            value={nextDueDate} 
                            type='date' 
                            className='h-9 md:h-10' 
                            onChange={(e) => setNextDueDate(e.target.value)} 
                        />
                    </div>
                </div>
                <Button
                    disabled={!(lender && amount && interestRate && tenure && nextDueDate && repaymentFrequency)}
                    onClick={saveLoan}
                    className='w-full h-9 md:h-10'
                >
                    Save Loan
                </Button>
            </div>
        </div>
    );
}

export default AddLoan;
