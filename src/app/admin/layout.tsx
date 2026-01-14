"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { IconLoader2 } from "@tabler/icons-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            // If not logged in, middleware handles it, but double check
            if (!user) {
                router.push('/login')
                return
            }

            // Check for admin role or permission
            const isAdmin = user.role === 'admin' || user.permissions?.includes('manage_users')

            if (!isAdmin) {
                router.push('/dashboard')
            }
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
                <IconLoader2 className="animate-spin text-primary" size={32} />
            </div>
        )
    }

    // Prevent flash of content for unauthorized users
    const isAdmin = user?.role === 'admin' || user?.permissions?.includes('manage_users')
    if (!isAdmin) {
        return null
    }

    return <>{children}</>
}
