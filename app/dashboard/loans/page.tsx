'use client'
import React, { useEffect, useState } from 'react'
import AddLoan from './_components/AddLoan'
import { useUser } from '@clerk/nextjs'
import { Loan } from '../_type/type'
import { getLoansByUser, getLoanSummary } from '@/utils/loanUtils'
import LoanItem from './_components/LoanItem'

function Loans() {
  const { user } = useUser()
  const [loans, setLoans] = useState<Loan[]>([])
  const fetchLoans = async () => {
    const loans = await getLoansByUser(user?.primaryEmailAddress?.emailAddress!)
    setLoans(loans)
  }

  useEffect(() => {
    user && fetchLoans()
  }, [user])
  return (
    <div className='p-10'>
      <div className='flex justify-between pb-3'>
        <h1 className='font-bold text-xl'>Loans</h1>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mt-4'>
        <div className='col-span-1'>
          <AddLoan refreshData={() => fetchLoans()} />
        </div>
        <div className='col-span-2 border rounded-lg p-3'>

        <h2 className='font-semibold mb-4'>My Loans</h2>
        <div className='flex justify-between p-1 px-5 bg-slate-100 rounded-xl my-1 text-sm font-semibold'>
            <div className='w-[30%] flex justify-start'>Lender</div>
            <div className='w-[15%] flex justify-end'>Principle</div>
            <div className='w-[15%] flex justify-start'>Tenure</div>
            <div className='w-[20%] flex justify-start'>Upcoming Payment</div>
            <div className='w-[10%] flex justify-end'>
            </div>
        </div>
          {
            loans.map((loan, index) => (
              <LoanItem key={index} loan={loan} refreshData={() => fetchLoans()} />
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default Loans