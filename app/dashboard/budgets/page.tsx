import React from 'react'
import BudgetList from './_components/BudgetList'

function Budgets() {
  return (
    <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <h1 className='font-bold text-3xl'>My Budgets</h1>
        <BudgetList />
    </div>
  )
}

export default Budgets