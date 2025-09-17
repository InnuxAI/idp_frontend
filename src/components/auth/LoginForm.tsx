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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { LoginFormData, loginSchema } from '@/lib/auth-types'

import { ShaderAnimation } from '../ui/shader-animation'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember_me: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, data.remember_me)
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    } catch (error) {
      // Error is handled by context (toast shown)
      console.error('Login error:', error)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 overflow-hidden">
      {/* Shader Animation Background */}
      <div className="absolute inset-0 w-full h-full">
        <ShaderAnimation />
      </div>
      
      {/* Login Card Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#171717]/90 backdrop-blur-sm border-[#262626] rounded-lg p-8 border shadow-lg">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-[#fafafa]">Sign In</h1>
              <p className="text-[#a3a3a3]">Enter your credentials to access your account</p>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-[#fafafa]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  {...form.register('email')}
                  className={`h-11 border focus:ring-1 bg-[#262626] text-[#fafafa] border-[#404040] placeholder:text-[#71717a] focus:border-[#3b82f6] ${
                    form.formState.errors.email ? 'border-red-500' : ''
                  }`}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-[#fafafa]">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    {...form.register('password')}
                    className={`pr-10 h-11 border focus:ring-1 bg-[#262626] text-[#fafafa] border-[#404040] placeholder:text-[#71717a] focus:border-[#3b82f6] ${
                      form.formState.errors.password ? 'border-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-[#71717a] hover:bg-[#404040]"
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

              <Button
                type="submit"
                className="w-full font-medium h-11 bg-[#3b82f6] text-[#fafafa] hover:bg-[#2563eb]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="text-center space-y-3">
              <p className="text-sm text-[#a3a3a3]">
                Don't have an account?{' '}
                <Link
                  href="/signup/form"
                  className="font-medium hover:underline text-[#3b82f6]"
                >
                  Sign up
                </Link>
              </p>
              
              <p className="text-sm text-[#a3a3a3]">
                Want secure signup?{' '}
                <Link
                  href="/signup/otp"
                  className="font-medium hover:underline text-[#3b82f6]"
                >
                  OTP Verification
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
