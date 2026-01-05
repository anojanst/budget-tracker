'use client'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/utils/dbConfig';
import { Expenses } from '@/utils/schema';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { PopoverContent } from '@radix-ui/react-popover';
import { CalendarIcon } from 'lucide-react';
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Tag } from '@/app/dashboard/_type/type';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { recalcBalanceHistoryFromDate } from '@/utils/recalcBalanceHistoryFromDate';
import VoiceInput, { ParsedVoiceData } from '@/app/dashboard/_components/VoiceInput';

function AddExpenses(props: { refreshData: () => void, tags: Tag[], budgetId: number }) {
    const { refreshData, tags, budgetId } = props
    const { user } = useUser()
    const [name, setName] = useState('')
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState<string>('')
    const [tagId, setTagId] = useState<number | null>(null)

    const handleVoiceParse = (parsed: ParsedVoiceData) => {
        console.log('Voice parsed data:', parsed)
        
        if (parsed.name) {
            setName(parsed.name)
        }
        if (parsed.amount) {
            setAmount(parsed.amount.toString())
        }
        if (parsed.date) {
            setDate(parsed.date)
        }
        if (parsed.tag) {
            // Try to find matching tag
            const matchingTag = tags.find(tag => 
                tag.name.toLowerCase().includes(parsed.tag!.toLowerCase()) ||
                parsed.tag!.toLowerCase().includes(tag.name.toLowerCase())
            )
            if (matchingTag) {
                setTagId(matchingTag.id)
                console.log('Matched tag:', matchingTag)
            } else {
                console.log('No matching tag found for:', parsed.tag)
            }
        }
        
        // Log what was set
        console.log('Form state after voice parse:', {
            name: parsed.name || name,
            amount: parsed.amount || amount,
            date: parsed.date || date,
            tagId: parsed.tag ? tags.find(t => 
                t.name.toLowerCase().includes(parsed.tag!.toLowerCase()) ||
                parsed.tag!.toLowerCase().includes(t.name.toLowerCase())
            )?.id : tagId
        })
    }

    const saveExpense = async () => {
        const amountNum = parseFloat(amount) || 0;
        console.log('Saving expense with data:', { name, amount: amountNum, date, tagId, createdBy: user?.primaryEmailAddress?.emailAddress })
        
        if (!name || !amount || amountNum <= 0 || !date) {
            console.error('Missing required fields:', { name, amount, date })
            toast.error('Please fill in name, amount, and date')
            return
        }

        try {
            const result = await db.insert(Expenses).values({
                name: name,
                amount: amountNum,
                createdBy: user?.primaryEmailAddress?.emailAddress!,
                date: date,
                budgetId: budgetId,
                tagId: tagId
            }).returning({ insertedId: Expenses.id })

            console.log('Expense saved successfully:', result)

            if (result) {
                recalcBalanceHistoryFromDate(user?.primaryEmailAddress?.emailAddress!, date, amountNum, "expense", "add");
                refreshData()
                toast(`Expense has been created.`)
                setAmount('')
                setName('')
                setDate(format(new Date(), 'yyyy-MM-dd'))
                setTagId(null)
            }
        } catch (error) {
            console.error('Error saving expense:', error)
            toast.error(`Failed to save expense: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    return (
        <div>
            <div className='space-y-3'>
                <div>
                    <VoiceInput 
                        type='expense' 
                        onTranscript={() => {}} 
                        onParse={handleVoiceParse}
                    />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Title - Eg: Groceries' 
                            value={name!} 
                            className='h-9 md:h-10' 
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Amount - Eg: 100' 
                            value={amount} 
                            type='number' 
                            className='h-9 md:h-10' 
                            min={0} 
                            onChange={(e) => setAmount(e.target.value)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Input 
                            placeholder='Date' 
                            value={date!} 
                            type='date' 
                            className='h-9 md:h-10' 
                            onChange={(e) => setDate(e.target.value)} 
                        />
                    </div>
                    <div className='md:col-span-1'>
                        <Select onValueChange={(value) => setTagId(parseInt(value))} value={tagId? tagId.toString() : ""}>
                            <SelectTrigger className="w-full h-9 md:h-10">
                                <SelectValue placeholder="Select a Tag (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {tags && tags.length > 0 ? (
                                        tags.map((tag, index) => (
                                            <SelectItem key={index} value={tag.id.toString()}>{tag.name}</SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                                            No tags available
                                        </div>
                                    )}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button
                    disabled={!(name && amount && parseFloat(amount) > 0 && date)}
                    onClick={() => saveExpense()}
                    className='w-full h-9 md:h-10'
                >
                    Save Expense
                </Button>
            </div>
        </div>
    )
}

export default AddExpenses