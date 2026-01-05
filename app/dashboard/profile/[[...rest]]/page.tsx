'use client'

import { UserProfile } from '@clerk/nextjs'
import { User } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="w-full px-2 py-3 pb-6 md:px-4 md:py-4 lg:px-6 lg:py-6 max-w-4xl mx-auto">
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg md:text-xl font-bold">Account Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="w-full flex justify-center">
        <UserProfile />
      </div>
    </div>
  )
}

