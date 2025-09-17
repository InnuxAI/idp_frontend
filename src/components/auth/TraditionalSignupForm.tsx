'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { TraditionalSignupFormData, traditionalSignupSchema } from '@/lib/auth-types'

import { ShaderAnimation } from '../ui/shader-animation'

export function TraditionalSignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { traditionalSignup, isLoading } = useAuth()
  const router = useRouter()

  const form = useForm<TraditionalSignupFormData>({
    resolver: zodResolver(traditionalSignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: TraditionalSignupFormData) => {
    try {
      const result = await traditionalSignup(data.email, data.password, data.confirmPassword, data.firstName, data.lastName)
      
      if (result?.pending) {
        // Account created but pending approval - don't redirect
        return
      } else if (result?.success) {
        // Account created and approved - redirect to dashboard
        router.push('/')
      }
    } catch (error) {
      console.error('Signup error:', error)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 overflow-hidden">
      {/* Shader Animation Background */}
      <div className="absolute inset-0 w-full h-full">
        <ShaderAnimation />
      </div>
      
      {/* Signup Card Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#171717]/90 backdrop-blur-sm border-[#262626] rounded-lg p-8 border shadow-lg">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-[#fafafa]">Sign Up</h1>
              <p className="text-[#a3a3a3]">Create a new account to get started</p>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#fafafa] text-sm">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    autoComplete="given-name"
                    {...form.register('firstName')}
                    className={`bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6] focus:ring-[#3b82f6] h-11 ${
                      form.formState.errors.firstName ? 'border-red-500' : ''
                    }`}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-400">{form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#fafafa] text-sm">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    autoComplete="family-name"
                    {...form.register('lastName')}
                    className={`bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6] focus:ring-[#3b82f6] h-11 ${
                      form.formState.errors.lastName ? 'border-red-500' : ''
                    }`}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-400">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#fafafa] text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  {...form.register('email')}
                  className={`bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6] focus:ring-[#3b82f6] h-11 ${
                    form.formState.errors.email ? 'border-red-500' : ''
                  }`}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#fafafa] text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    {...form.register('password')}
                    className={`bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6] focus:ring-[#3b82f6] pr-10 h-11 ${
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#fafafa] text-sm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    {...form.register('confirmPassword')}
                    className={`bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6] focus:ring-[#3b82f6] pr-10 h-11 ${
                      form.formState.errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-[#404040] text-[#71717a]"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-400">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#3b82f6] text-[#fafafa] hover:bg-[#2563eb] font-medium h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>

            <div className="text-center space-y-3">
              <p className="text-[#a3a3a3] text-sm">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-[#3b82f6] hover:text-[#2563eb] font-medium"
                >
                  Sign in
                </Link>
              </p>
              
              <p className="text-[#a3a3a3] text-sm">
                Want email verification?{' '}
                <Link
                  href="/signup/otp"
                  className="text-[#3b82f6] hover:text-[#2563eb] font-medium"
                >
                  Secure Signup with OTP
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
