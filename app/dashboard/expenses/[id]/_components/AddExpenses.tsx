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

function AddExpenses(props: { refreshData: () => void, tags: Tag[] }) {
    const { refreshData, tags } = props
    const { user } = useUser()
    const [name, setName] = useState('')
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState(0)
    const [tagId, setTagId] = useState<number | null>(null)

    const handleVoiceParse = (parsed: ParsedVoiceData) => {
        console.log('Voice parsed data:', parsed)
        
        if (parsed.name) {
            setName(parsed.name)
        }
        if (parsed.amount) {
            setAmount(parsed.amount)
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
        console.log('Saving expense with data:', { name, amount, date, tagId, createdBy: user?.primaryEmailAddress?.emailAddress })
        
        if (!name || !amount || !date || !tagId) {
            console.error('Missing required fields:', { name, amount, date, tagId })
            toast.error('Please fill in all required fields')
            return
        }

        try {
            const result = await db.insert(Expenses).values({
                name: name,
                amount: amount,
                createdBy: user?.primaryEmailAddress?.emailAddress!,
                date: date,
                tagId: tagId
            }).returning({ insertedId: Expenses.id })

            console.log('Expense saved successfully:', result)

            if (result) {
                recalcBalanceHistoryFromDate(user?.primaryEmailAddress?.emailAddress!, date, amount, "expense", "add");
                refreshData()
                toast(`Expense has been created. Budget Id is: ${result[0].insertedId!} `)
                setAmount(0)
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
            <div>
                <h2 className='font-semibold'>Add New Budget</h2>
            </div>
            <div className='p-2 border rounded-lg mt-1'>
                <div className='mb-2'>
                    <VoiceInput 
                        type='expense' 
                        onTranscript={() => {}} 
                        onParse={handleVoiceParse}
                    />
                </div>
                <div className='grid grid-cols-2 gap-2'>
                    <div className=' col-span-1'>
                        <Input placeholder='Title - Eg: Groceries' value={name!} className='h-8' onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className=' col-span-1'>
                        <Input placeholder='Amount - Eg: 100' value={amount!} type='number' className='h-8' min={0} onChange={(e) => setAmount(parseInt(e.target.value))} />
                    </div>
                    <div className=' col-span-1'>
                    <Input placeholder='date' value={date!} type='date' className='h-8' min={0} onChange={(e) => setDate(e.target.value)} />
                        
                    </div>
                    <div className=' col-span-1'>
                        <Select onValueChange={(value) => setTagId(parseInt(value))} value={tagId? tagId.toString() : ""}>
                            <SelectTrigger className="w-full h-8">
                                <SelectValue placeholder="Select a Tag" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {tags && tags.map((tag, index) => (
                                        <SelectItem key={index} value={tag.id.toString()}>{tag.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='mt-1 col-span-2'>

                        <Button
                            disabled={!(name && amount && date && tagId)}
                            onClick={() => saveExpense()}
                            className='w-full h-8'>Save Expense</Button>
                    </div>

                </div>
            </div>

        </div>
    )
}

export default AddExpenses