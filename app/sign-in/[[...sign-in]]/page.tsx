'use client'

import { SignIn, SignedIn, SignedOut } from '@clerk/nextjs'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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

export default function Page() {
    return (
        <section className="bg-white min-h-screen w-full relative">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image 
                    src="/sign-in.webp" 
                    alt="background" 
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            {/* Centered Sign-In Component */}
            <div className="relative z-10 min-h-screen w-full flex items-center justify-center px-4 py-8">
                <SignedIn>
                    <RedirectToDashboard />
                </SignedIn>

                <SignedOut>
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                        <SignIn />
                    </div>
                </SignedOut>
            </div>
        </section>
    )
}
