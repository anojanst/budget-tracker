'use client'
import React, { useEffect } from 'react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import EmojiPicker from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/utils/dbConfig';
import { Budgets } from '@/utils/schema';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { PenBox } from 'lucide-react';
import { Budget } from '@/app/dashboard/_type/type';
import { eq } from 'drizzle-orm';

function CreateBudget(props: { refreshData: () => void, budget: Budget }) {
    const { refreshData, budget } = props
    const { user } = useUser()
    const [emojiIcon, setEmojiIcon] = React.useState(budget?.icon!)
    const [openEmojiPicker, setOpenEmojiPicker] = React.useState(false)
    const [name, setName] = React.useState(budget?.name!)
    const [amount, setAmount] = React.useState(budget?.amount!)
    const createBudget = async () => {
        const result = await db.update(Budgets).set({
            name: name,
            amount: amount,
            icon: emojiIcon,
            createdBy: user?.primaryEmailAddress?.emailAddress!
        }).where(eq(Budgets.id, budget.id))
            .returning()

        if (result) {
            refreshData()
            toast(`Budget is updated`)
        }
    }

    useEffect(() => {
        setName(budget?.name!)
        setAmount(budget?.amount!)
        setEmojiIcon(budget?.icon!)
    }, [budget])

    return (
        <Dialog>
            <DialogTrigger>
                <span className='bg-primary p-3 h-8 px-4 text-white flex gap-2 rounded-md text-sm items-center'><PenBox size={16} /></span>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Budget ( {budget?.name} )</DialogTitle>
                    <div>
                        <Button variant="outline" className='text-xl mt-2'
                            onClick={() => setOpenEmojiPicker(!openEmojiPicker)}>
                            {emojiIcon}
                        </Button>

                        <div className='absolute z-20 py-3'>
                            <EmojiPicker
                                open={openEmojiPicker}
                                onEmojiClick={(e) => {
                                    setEmojiIcon(e.emoji)
                                    setOpenEmojiPicker(false)
                                }} />
                        </div>

                        <div className='mt-2'>
                            <h2 className="font-semibold my-1">Budget Title</h2>
                            <Input placeholder='Eg: Groceries' defaultValue={budget?.name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className='mt-2'>
                            <h2 className="font-semibold my-1">Budget Amount</h2>
                            <Input placeholder='Eg: 100' type='number' defaultValue={budget?.amount} min={0} onChange={(e) => setAmount(parseInt(e.target.value))} />
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button
                            disabled={!(name && amount)}
                            onClick={() => createBudget()}
                            className='w-full'>Create Budget</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CreateBudget