'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { OtpSignupFormData, otpSignupSchema } from '@/lib/auth-types'

import { ShaderAnimation } from '../ui/shader-animation'

interface OTPSignupFormProps {
  onOTPSent: (email: string) => void
}

export function OTPSignupForm({ onOTPSent }: OTPSignupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { otpSignup } = useAuth()

  const form = useForm<OtpSignupFormData>({
    resolver: zodResolver(otpSignupSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: OtpSignupFormData) => {
    try {
      setIsSubmitting(true)
      await otpSignup(data.email)
      onOTPSent(data.email)
    } catch (error) {
      console.error('OTP signup error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 overflow-hidden">
      {/* Shader Animation Background */}
      <div className="absolute inset-0 w-full h-full">
        <ShaderAnimation />
      </div>
      
      {/* OTP Signup Card Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#171717]/90 backdrop-blur-sm border-[#262626] rounded-2xl p-8 border">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-[#fafafa]">Email Verification</h1>
              <p className="text-[#a3a3a3]">Create your account with email verification</p>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#262626]">
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4 text-center">Create Account</h2>
              <p className="text-[#a3a3a3] text-center mb-6">Enter your Gmail address to get started</p>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#fafafa]">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your-email@gmail.com"
                    autoComplete="email"
                    {...form.register('email')}
                    className={`bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6] focus:ring-[#3b82f6] ${
                      form.formState.errors.email ? 'border-red-500' : ''
                    }`}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="text-sm text-[#71717a]">
                  Only Gmail addresses are accepted
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#3b82f6] text-[#fafafa] hover:bg-[#2563eb] font-medium py-3 flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div className="text-center space-y-4">
              <p className="text-[#a3a3a3]">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-[#3b82f6] hover:text-[#2563eb] font-medium"
                >
                  Sign in
                </Link>
              </p>
              
              <p className="text-[#a3a3a3]">
                Want to use the simple signup?{' '}
                <Link
                  href="/signup/form"
                  className="text-[#3b82f6] hover:text-[#2563eb] font-medium"
                >
                  Basic Signup
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
