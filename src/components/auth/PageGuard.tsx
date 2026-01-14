'use client'

import { useEffect, useState, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getPermissionForPath } from '@/lib/page-permissions'

interface PageGuardProps {
    children: ReactNode
}

/**
 * PageGuard Component
 * 
 * Automatically checks if the current user has permission to access the current page
 * based on the route-to-permission mapping in page-permissions.ts
 * 
 * Wrap your page content or layout with this component for automatic protection.
 */
export function PageGuard({ children }: PageGuardProps) {
    const { user, isAuthenticated, isLoading } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const [permissionChecked, setPermissionChecked] = useState(false)
    const [hasAccess, setHasAccess] = useState(false)

    useEffect(() => {
        // Wait for auth to finish loading
        if (isLoading) {
            setPermissionChecked(false)
            return
        }

        // If not authenticated, let middleware handle it
        if (!isAuthenticated) {
            setPermissionChecked(true)
            setHasAccess(true) // Will be redirected by middleware anyway
            return
        }

        // Get required permission for this path
        const requiredPermission = getPermissionForPath(pathname)

        // No permission required for this route
        if (!requiredPermission) {
            setPermissionChecked(true)
            setHasAccess(true)
            return
        }

        // Check if user has the required permission
        const userPermissions = user?.permissions || []
        const hasPermission = userPermissions.includes(requiredPermission)

        console.log(`[PageGuard] Checking ${pathname}:`, {
            requiredPermission,
            userPermissions,
            hasPermission,
            user: user?.email
        })

        if (!hasPermission) {
            console.warn(`[PageGuard] Access denied to ${pathname}: requires ${requiredPermission}`)
            router.replace('/unauthorized')
            return
        }

        setPermissionChecked(true)
        setHasAccess(true)
    }, [isAuthenticated, isLoading, pathname, router, user?.permissions])

    // Show loading state while auth is loading or permission not yet checked
    if (isLoading || !permissionChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // If no access, return null (redirect is happening)
    if (!hasAccess) {
        return null
    }

    return <>{children}</>
}

/**
 * withPageGuard HOC
 * 
 * Alternative to the PageGuard component for wrapping entire pages
 */
export function withPageGuard<P extends object>(
    WrappedComponent: React.ComponentType<P>
): React.FC<P> {
    return function PageGuardedComponent(props: P) {
        return (
            <PageGuard>
                <WrappedComponent {...props} />
            </PageGuard>
        )
    }
}

