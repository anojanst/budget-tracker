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
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principalAmount, 0)
  const totalEMI = loans.reduce((sum, loan) => sum + loan.EMI, 0)

  return (
    <div className='w-full px-2 py-3 pb-6 md:px-4 md:py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='mb-4 md:mb-6'>
        <h1 className='font-bold text-lg md:text-xl'>Loans</h1>
      </div>

      {/* Loan Summary and Add Loan - Mobile: stacked, Desktop: side by side */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6 items-stretch'>
        {/* Add Loan */}
        <div className='flex'>
          <div className='border rounded-lg p-3 md:p-4 bg-card w-full flex flex-col'>
            <AddLoan refreshData={() => fetchLoans()} />
          </div>
        </div>
        
        {/* Loan Summary */}
        <div className='flex lg:col-span-2'>
          <div className='border rounded-lg p-3 md:p-4 bg-card w-full flex flex-col'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex flex-col'>
                <span className='text-xs md:text-sm text-muted-foreground'>Total Principal</span>
                <span className='text-xl md:text-2xl font-bold text-primary'>${totalPrincipal.toLocaleString()}</span>
              </div>
              <div className='flex flex-col items-end'>
                <span className='text-xs md:text-sm text-muted-foreground'>Total EMI</span>
                <span className='text-xl md:text-2xl font-bold text-foreground'>
                  ${totalEMI.toLocaleString()}
                </span>
              </div>
            </div>
            <div className='mt-auto'>
              <div className='text-xs md:text-sm text-muted-foreground'>
                {loans.length} {loans.length === 1 ? 'active loan' : 'active loans'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loans List */}
      <div className='border rounded-lg p-3 md:p-4 bg-card'>
        <h2 className='font-semibold text-base md:text-lg mb-3 md:mb-4'>My Loans</h2>
        {loans.length > 0 ? (
          <div className='space-y-4'>
            {loans.map((loan, index) => (
              <LoanItem key={index} loan={loan} refreshData={() => fetchLoans()} />
            ))}
          </div>
        ) : (
          <div className='text-center py-8 text-muted-foreground text-sm'>
            <p>No loans yet. Add your first loan above!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Loans