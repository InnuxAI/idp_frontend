'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: string
  fallbackUrl?: string
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  fallbackUrl = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Store the intended URL to redirect after login
        const currentUrl = window.location.pathname + window.location.search
        const redirectUrl = `${fallbackUrl}?returnUrl=${encodeURIComponent(currentUrl)}`
        router.push(redirectUrl)
        return
      }

      if (requiredPermission && !checkPermission(requiredPermission)) {
        // User doesn't have required permission
        router.push('/unauthorized')
        return
      }
    }
  }, [isAuthenticated, isLoading, requiredPermission, router, fallbackUrl, checkPermission])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated or lacking permission
  if (!isAuthenticated || (requiredPermission && !checkPermission(requiredPermission))) {
    return null
  }

  return <>{children}</>
}

interface RoleGuardProps {
  children: ReactNode
  requiredPermission: string
  fallback?: ReactNode
}

export function RoleGuard({ children, requiredPermission, fallback }: RoleGuardProps) {
  const { checkPermission, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return null
  }

  if (!checkPermission(requiredPermission)) {
    return fallback || (
      <div className="p-4 text-center">
        <p className="text-gray-600">You don't have permission to access this feature.</p>
      </div>
    )
  }

  return <>{children}</>
}

interface ConditionalRenderProps {
  children: ReactNode
  condition: boolean
  fallback?: ReactNode
}

export function ConditionalRender({ children, condition, fallback }: ConditionalRenderProps) {
  if (!condition) {
    return fallback || null
  }

  return <>{children}</>
}
