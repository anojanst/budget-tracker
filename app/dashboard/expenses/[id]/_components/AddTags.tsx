'use client'
import React from 'react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/utils/dbConfig';
import { Tags } from '@/utils/schema';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

function AddTags(props: { refreshData: () => void, budgetId: number }) {
    const { refreshData, budgetId } = props
    const { user } = useUser()
    const [name, setName] = React.useState('')

    const addTag = async () => {
        const result = await db.insert(Tags).values({
            name: name,
            budgetId: budgetId,
            createdBy: user?.primaryEmailAddress?.emailAddress!
        }).returning({ insertedId: Tags.id })

        if (result) {
            refreshData()
            setName('')
            toast(`Tag has been created. Tag Id is: ${result[0].insertedId!} `)
        }
    }

    return (
        <div>
            <h2 className='font-semibold text-sm md:text-base mb-3'>Add Tag</h2>
            <div className='space-y-3'>
                <Input 
                    value={name} 
                    placeholder='Tag Name - Eg: Groceries' 
                    className='h-9 md:h-10' 
                    onChange={(e) => setName(e.target.value)} 
                />
                <Button
                    disabled={!name}
                    onClick={() => addTag()}
                    className='w-full h-9 md:h-10'
                >
                    Add Tag
                </Button>
            </div>
        </div>
    )
}

export default AddTags