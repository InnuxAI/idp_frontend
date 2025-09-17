'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { OtpVerificationFormData, otpVerificationSchema } from '@/lib/auth-types'

import { ShaderAnimation } from '../ui/shader-animation'

interface OTPVerificationProps {
  email: string
  onResendOTP: () => void
}

export function OTPVerification({ email, onResendOTP }: OTPVerificationProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { verifyOTP, isLoading } = useAuth()
  const router = useRouter()
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const form = useForm<OtpVerificationFormData>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      email,
      otp: '',
      firstName: '',
      lastName: '',
      password: '',
    },
  })

  // Start countdown timer for resend OTP
  useEffect(() => {
    setCountdown(60) // 60 seconds countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const onSubmit = async (data: OtpVerificationFormData) => {
    try {
      const result = await verifyOTP(data.email, data.otp, data.password, data.firstName, data.lastName)
      
      if (result?.pending) {
        // Account created but pending approval - don't redirect
        return
      } else if (result?.success) {
        // Account created and approved - redirect to dashboard
        router.push('/')
      }
    } catch (error) {
      console.error('OTP verification error:', error)
    }
  }

  const handleOTPChange = (value: string, index: number) => {
    // Only allow digits
    const sanitizedValue = value.replace(/\D/g, '')
    
    // Update the current input
    if (sanitizedValue.length <= 1) {
      const newOTP = form.getValues('otp').split('')
      newOTP[index] = sanitizedValue
      form.setValue('otp', newOTP.join(''))

      // Move to next input if value is entered
      if (sanitizedValue && index < 5) {
        otpInputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !form.getValues('otp')[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendOTP = () => {
    onResendOTP()
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const otpValue = form.watch('otp')

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 overflow-hidden">
      {/* Shader Animation Background */}
      <div className="absolute inset-0 w-full h-full">
        <ShaderAnimation />
      </div>
      
      {/* OTP Verification Card Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#171717]/90 backdrop-blur-sm border-[#262626] rounded-2xl p-8 border">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-[#fafafa]">Verify your email</h1>
              <p className="text-[#a3a3a3]">
                Enter the 6-digit code sent to <br />
                <span className="font-medium text-[#fafafa]">{email}</span>
              </p>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#fafafa]">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    autoComplete="given-name"
                    {...form.register('firstName')}
                    className={`bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6] focus:ring-[#3b82f6] ${
                      form.formState.errors.firstName ? 'border-red-500' : ''
                    }`}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-400">{form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#fafafa]">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    autoComplete="family-name"
                    {...form.register('lastName')}
                    className={`bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6] focus:ring-[#3b82f6] ${
                      form.formState.errors.lastName ? 'border-red-500' : ''
                    }`}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-400">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#fafafa] text-center block">Verification Code</Label>
                <div className="flex justify-center space-x-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <Input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el }}
                      type="text"
                      maxLength={1}
                      value={otpValue[index] || ''}
                      onChange={(e) => handleOTPChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-12 h-12 text-center text-lg font-semibold bg-[#262626] border-[#404040] text-[#fafafa] focus:border-[#3b82f6] focus:ring-[#3b82f6]"
                      autoComplete="off"
                    />
                  ))}
                </div>
                {form.formState.errors.otp && (
                  <p className="text-sm text-red-400 text-center">{form.formState.errors.otp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#fafafa]">Set Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                    {...form.register('password')}
                    className={`bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6] focus:ring-[#3b82f6] pr-10 ${
                      form.formState.errors.password ? 'border-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-[#404040] text-[#71717a]"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="text-xs text-[#71717a] space-y-1">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#3b82f6] text-[#fafafa] hover:bg-[#2563eb] font-medium py-3"
                disabled={isLoading || otpValue.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify and create account'
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-[#a3a3a3]">
                  Didn&apos;t receive the code?
                </p>
                {countdown > 0 ? (
                  <p className="text-sm text-[#71717a]">
                    Resend code in {countdown} seconds
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResendOTP}
                    className="text-[#3b82f6] hover:text-[#2563eb] hover:bg-[#262626]"
                  >
                    <RefreshCw className="mr-1 h-4 w-4" />
                    Resend code
                  </Button>
                )}
              </div>

              <div className="text-center">
                <Link
                  href="/signup"
                  className="text-sm text-[#3b82f6] hover:text-[#2563eb]"
                >
                  ← Back to signup options
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
