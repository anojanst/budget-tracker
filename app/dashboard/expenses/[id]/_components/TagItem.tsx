import { Tag } from '@/app/dashboard/_type/type'
import { Badge } from '@/components/ui/badge'
import React from 'react'

function TagItem(props: { tag: Tag }) {
    const { tag } = props
    return (
        <div className='flex flex-col gap-2 bg-slate-50 p-2.5 md:p-3 rounded-lg border border-slate-200'>
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
    )
}

export default TagItem