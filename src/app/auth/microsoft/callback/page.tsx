'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/auth-api'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function MicrosoftCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                    <h2 className="text-xl font-semibold text-white">Loading...</h2>
                </div>
            </div>
        }>
            <MicrosoftCallbackContent />
        </Suspense>
    )
}

function MicrosoftCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get authorization code from URL
                const code = searchParams.get('code')
                const state = searchParams.get('state')
                const error = searchParams.get('error')
                const errorDescription = searchParams.get('error_description')

                // Check for errors from Microsoft
                if (error) {
                    throw new Error(errorDescription || error)
                }

                if (!code) {
                    throw new Error('No authorization code received from Microsoft')
                }

                // Exchange code for tokens (or pending approval status)
                const response = await authAPI.handleMicrosoftCallback(code, state || undefined)

                if (response.success) {
                    // Check if account is pending approval (same as traditional signup)
                    if (response.data?.status === 'pending_approval') {
                        setStatus('success')
                        setErrorMessage('Account created! Please wait for admin approval.')
                        toast.success('Account created successfully! Please wait for admin approval.', {
                            duration: 5000
                        })

                        // Redirect to login after showing message
                        setTimeout(() => {
                            router.push('/login')
                        }, 5000)
                    } else if (response.data?.user) {
                        // User is approved - login successful
                        setStatus('success')
                        toast.success('Successfully signed in with Microsoft!')

                        // Redirect to dashboard
                        setTimeout(() => {
                            router.push('/dashboard')
                        }, 1000)
                    } else {
                        throw new Error('Unexpected response from server')
                    }
                } else {
                    throw new Error(response.message || 'Authentication failed')
                }
            } catch (error: any) {
                console.error('Microsoft callback error:', error)
                setStatus('error')
                setErrorMessage(error.message || 'Authentication failed')
                toast.error(error.message || 'Failed to sign in with Microsoft')

                // Redirect to login after showing error
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            }
        }

        handleCallback()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="text-center space-y-4">
                {status === 'processing' && (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-white">Completing Microsoft Sign-In...</h2>
                        <p className="text-zinc-400">Please wait while we authenticate your account</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white">
                            {errorMessage ? 'Account Created!' : 'Success!'}
                        </h2>
                        <p className="text-zinc-400">
                            {errorMessage || 'Redirecting to dashboard...'}
                        </p>
                        {errorMessage && (
                            <p className="text-sm text-zinc-500">You will be notified once approved</p>
                        )}
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white">Authentication Failed</h2>
                        <p className="text-zinc-400">{errorMessage}</p>
                        <p className="text-sm text-zinc-500">Redirecting to login...</p>
                    </>
                )}
            </div>
        </div>
    )
}
