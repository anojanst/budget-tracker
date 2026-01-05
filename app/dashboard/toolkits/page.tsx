import { Calculator, HandCoins, Landmark, PiggyBank } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function Toolkits() {
  const tools = [
    {
      id: 1,
      name: 'Tax Calculator',
      icon: Calculator,
      path: '/dashboard/toolkits/tax-calculator',
    },
    {
      id: 2,
      name: 'EMI Calculator',
      icon: Landmark,
      path: '/dashboard/toolkits/emi-calculator',
    },
    {
      id: 3,
      name: 'Compound Calculator',
      icon: HandCoins,
      path: '/dashboard/toolkits/compound-calculator',
    },
    {
      id: 4,
      name: 'FD Calculator',
      icon: PiggyBank,
      path: '/dashboard/toolkits/fd-calculator',
    },
  ]
  return (
    <div className='w-full px-2 py-3 pb-6 md:px-4 md:py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto'>
      <div className='mb-4 md:mb-6'>
        <h2 className='text-lg md:text-xl font-semibold'>Your Financial Swiss Knife</h2>
        <p className='text-sm text-muted-foreground mt-1'>Calculate taxes, loans, investments, and more</p>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'>
        {tools.map((item, index) => (
          <Link key={item.id} href={item.path}>
            <div
              className={`flex flex-col items-center justify-center rounded-lg w-full p-4 md:p-5 border-2 font-medium cursor-pointer transition-all hover:scale-105
                ${index % 2 === 0
                  ? "bg-primary border-primary text-white hover:bg-primary/90"
                  : "bg-card border-border hover:border-primary"
                }`}
            >
              <item.icon className='mb-2 md:mb-3' size={32} />
              <span className='text-sm md:text-base text-center'>{item.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Toolkits