'use client'
import React from 'react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/utils/dbConfig';
import { Tags } from '@/utils/schema';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Tag } from '@/app/dashboard/_type/type';
import { Badge } from '@/components/ui/badge';

function TagsSection(props: { refreshData: () => void, budgetId: number, tags: Tag[] | undefined }) {
    const { refreshData, budgetId, tags } = props
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
        <div className='border rounded-lg p-3 md:p-4 bg-card'>
            <h2 className='font-semibold text-base md:text-lg mb-3 md:mb-4'>Tags</h2>
            
            {/* Add Tag Form */}
            <div className='mb-4 md:mb-6 pb-4 md:pb-6 border-b border-slate-200'>
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

            {/* Tags List */}
            {tags && tags.length > 0 ? (
                <div className='space-y-2'>
                    {tags.map((tag, index) => (
                        <div key={index} className='flex flex-col gap-2 bg-slate-50 p-2.5 md:p-3 rounded-lg border border-slate-200'>
                            <div className='flex items-center justify-between'>
                                <h3 className="font-semibold text-sm md:text-base">{tag.name}</h3>
                            </div>
                            {(tag.expenseCount > 0 || tag.totalSpent > 0) && (
                                <div className='flex flex-wrap gap-1.5'>
                                    {tag.expenseCount > 0 && (
                                        <Badge variant="secondary" className='text-xs bg-primary/10 text-primary border-primary/20'>
                                            {tag.expenseCount} {tag.expenseCount === 1 ? 'expense' : 'expenses'}
                                        </Badge>
                                    )}
                                    {tag.totalSpent > 0 && (
                                        <Badge variant="secondary" className='text-xs bg-primary/10 text-primary border-primary/20'>
                                            ${tag.totalSpent.toLocaleString()} spent
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className='text-center py-8 text-muted-foreground text-sm'>
                    <p>No tags yet. Create tags to categorize expenses!</p>
                </div>
            )}
        </div>
    )
}

export default TagsSection

