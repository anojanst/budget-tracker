'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/utils/dbConfig';
import { Incomes, incomeCategoryEnum } from '@/utils/schema';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { format } from "date-fns";
import { recalcBalanceHistoryFromDate } from "@/utils/recalcBalanceHistoryFromDate";
import VoiceInput, { ParsedVoiceData } from '@/app/dashboard/_components/VoiceInput';

function AddIncome(props: { refreshData: () => void }) {
    const { refreshData } = props;
    const { user } = useUser();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [category, setCategory] = useState<string>("Salary"); // Default category

    const handleVoiceParse = (parsed: ParsedVoiceData) => {
        if (parsed.name) {
            setName(parsed.name)
        }
        if (parsed.amount) {
            setAmount(parsed.amount)
        }
        if (parsed.date) {
            setDate(parsed.date)
        }
        if (parsed.category) {
            setCategory(parsed.category)
        }
    }

    const saveIncome = async () => {
        const result = await db.insert(Incomes).values({
            name: name,
            amount: amount,
            createdBy: user?.primaryEmailAddress?.emailAddress!,
            date: date,
            category: category as typeof incomeCategoryEnum.enumValues[number]
        }).returning({ insertedId: Incomes.id });

        if (result) {
            recalcBalanceHistoryFromDate(user?.primaryEmailAddress?.emailAddress!, date, amount, "income", "add");
            refreshData();
            toast(`Income has been added.`);
            setName('');
            setAmount(0);
            setDate(format(new Date(), 'yyyy-MM-dd'));
            setCategory("Salary");
        }
    };

    return (
        <div>
            <h2 className='font-semibold text-sm md:text-base mb-3'>Add Income</h2>
            <div className='space-y-3'>
                <div>
                    <VoiceInput 
                        type='income' 
                        onTranscript={() => {}} 
                        onParse={handleVoiceParse}
                    />
                </div>
                <div className='grid grid-cols-1 gap-2'>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Source - Eg: Salary' 
                            value={name} 
                            className='h-9 md:h-10' 
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Amount - Eg: 1000' 
                            value={amount} 
                            type='number' 
                            className='h-9 md:h-10' 
                            min={0} 
                            onChange={(e) => setAmount(parseInt(e.target.value) || 0)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Date' 
                            value={date} 
                            type='date' 
                            className='h-9 md:h-10' 
                            onChange={(e) => setDate(e.target.value)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-9 md:h-10">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {incomeCategoryEnum.enumValues.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button
                    disabled={!(name && amount && date && category)}
                    onClick={saveIncome}
                    className='w-full h-9 md:h-10'
                >
                    Save Income
                </Button>
            </div>
        </div>
    );
}

export default AddIncome;
