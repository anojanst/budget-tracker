'use client'

import { SignIn, SignedIn, SignedOut } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
    PiggyBank, 
    Wallet, 
    ReceiptText, 
    Landmark, 
    ShoppingCart, 
    Target, 
    Calculator,
    HandCoins,
    TrendingUp,
    DollarSign,
    CreditCard,
    Banknote,
    Coins,
    PieChart
} from 'lucide-react'

function RedirectToDashboard() {
    const router = useRouter()
    useEffect(() => {
        router.push('/dashboard')
    }, [router])
    return (
        <div className="text-center">
            <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
    )
}

// Budget-related icons with their positions and styles (fixed values to prevent hydration mismatch)
const backgroundIcons = [
    { Icon: PiggyBank, x: '10%', y: '15%', size: 48, color: 'text-blue-500', opacity: 'opacity-20', rotation: -5, duration: 4, delay: 0.2 },
    { Icon: Wallet, x: '85%', y: '20%', size: 56, color: 'text-green-500', opacity: 'opacity-15', rotation: 8, duration: 5, delay: 0.5 },
    { Icon: ReceiptText, x: '15%', y: '45%', size: 52, color: 'text-purple-500', opacity: 'opacity-25', rotation: -3, duration: 3.5, delay: 0.8 },
    { Icon: Landmark, x: '80%', y: '50%', size: 60, color: 'text-indigo-500', opacity: 'opacity-20', rotation: 6, duration: 6, delay: 0.1 },
    { Icon: ShoppingCart, x: '5%', y: '75%', size: 48, color: 'text-orange-500', opacity: 'opacity-18', rotation: -7, duration: 4.5, delay: 1.2 },
    { Icon: Target, x: '90%', y: '70%', size: 54, color: 'text-pink-500', opacity: 'opacity-22', rotation: 4, duration: 5.5, delay: 0.3 },
    { Icon: Calculator, x: '25%', y: '10%', size: 44, color: 'text-cyan-500', opacity: 'opacity-20', rotation: -8, duration: 3.8, delay: 0.6 },
    { Icon: HandCoins, x: '70%', y: '15%', size: 50, color: 'text-amber-500', opacity: 'opacity-18', rotation: 5, duration: 4.2, delay: 0.9 },
    { Icon: TrendingUp, x: '50%', y: '5%', size: 46, color: 'text-emerald-500', opacity: 'opacity-15', rotation: -4, duration: 5.2, delay: 0.4 },
    { Icon: DollarSign, x: '40%', y: '30%', size: 42, color: 'text-teal-500', opacity: 'opacity-20', rotation: 7, duration: 3.2, delay: 1.1 },
    { Icon: CreditCard, x: '60%', y: '35%', size: 48, color: 'text-rose-500', opacity: 'opacity-22', rotation: -6, duration: 4.8, delay: 0.7 },
    { Icon: Banknote, x: '30%', y: '65%', size: 52, color: 'text-violet-500', opacity: 'opacity-18', rotation: 3, duration: 5.8, delay: 0.2 },
    { Icon: Coins, x: '75%', y: '80%', size: 46, color: 'text-sky-500', opacity: 'opacity-20', rotation: -9, duration: 4.3, delay: 1.0 },
    { Icon: PieChart, x: '55%', y: '85%', size: 50, color: 'text-fuchsia-500', opacity: 'opacity-15', rotation: 2, duration: 6.2, delay: 0.5 },
    { Icon: PiggyBank, x: '20%', y: '25%', size: 40, color: 'text-blue-400', opacity: 'opacity-12', rotation: -4, duration: 3.6, delay: 0.8 },
    { Icon: Wallet, x: '65%', y: '60%', size: 44, color: 'text-green-400', opacity: 'opacity-15', rotation: 9, duration: 4.6, delay: 0.3 },
    { Icon: ReceiptText, x: '45%', y: '55%', size: 38, color: 'text-purple-400', opacity: 'opacity-18', rotation: -2, duration: 5.3, delay: 1.3 },
    { Icon: Target, x: '35%', y: '80%', size: 42, color: 'text-pink-400', opacity: 'opacity-20', rotation: 6, duration: 3.9, delay: 0.6 },
]

export default function Page() {
    return (
        <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen w-full relative overflow-hidden">
            {/* Animated Background Icons */}
            <div className="absolute inset-0 z-0">
                {backgroundIcons.map((item, index) => {
                    const Icon = item.Icon
                    return (
                        <div
                            key={index}
                            className={`absolute ${item.color} ${item.opacity} transition-all duration-300 hover:opacity-30`}
                            style={{
                                left: item.x,
                                top: item.y,
                                transform: `rotate(${item.rotation}deg)`,
                                animation: `float ${item.duration}s ease-in-out infinite`,
                                animationDelay: `${item.delay}s`,
                            }}
                        >
                            <Icon size={item.size} />
                        </div>
                    )
                })}
            </div>

            {/* Subtle overlay for better contrast */}
            <div className="absolute inset-0 bg-white/30 z-0"></div>

            {/* Centered Sign-In Component */}
            <div className="relative z-10 min-h-screen w-full flex items-center justify-center">
                <SignedIn>
                    <RedirectToDashboard />
                </SignedIn>

                <SignedOut>
                    <SignIn />
                </SignedOut>
            </div>

            {/* Add floating animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes float {
                        0%, 100% {
                            transform: translateY(0px) rotate(0deg);
                        }
                        50% {
                            transform: translateY(-20px) rotate(5deg);
                        }
                    }
                `
            }} />
        </section>
    )
}
