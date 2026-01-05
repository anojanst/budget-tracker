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
    <div className='w-full p-5'>
      <h2 className='text-xl font-semibold mb-4 mt-5'>Your Financial Swiss Knife</h2>
      <div className='grid grid-cols-4 gap-5'>
        {tools.map((item, index) => (
          <Link className='col-span-1' key={item.id} href={item.path}>
            <div
              key={item.id}
              className={`flex items-center rounded-md w-full p-5 mt-1 border-2 font-medium cursor-pointer hover:border-primary
                ${index % 2 === 0
                  ? "bg-primary border-primary text-white hover:text-primary hover:bg-purple-200"
                  : "bg-purple-200 border-purple-200 text-primary"
                }`}
            >
              <item.icon className='mr-2' size={40} />
              <span className='text-lg'>{item.name}</span>
            </div>
          </Link>
        ))}

      </div>
    </div>
  )
}

export default Toolkits