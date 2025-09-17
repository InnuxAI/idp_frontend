'use client'

import Link from 'next/link'
import { UserPlus, Mail, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="bg-[#171717] border-[#262626]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center text-[#fafafa] mb-2">Welcome to IDP</CardTitle>
            <p className="text-center text-[#71717a] text-sm mb-4">Intelligent Document Processing</p>
            <CardTitle className="text-2xl font-bold text-center text-[#fafafa]">Get started</CardTitle>
            <CardDescription className="text-center text-[#a3a3a3]">
              Choose how you&apos;d like to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Link href="/signup/form">
              <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-2 hover:border-[#3b82f6] bg-[#1a1a1a] border-[#262626] mb-4">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-[#262626] p-2 rounded-lg">
                      <UserPlus className="h-5 w-5 text-[#3b82f6]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1 text-[#fafafa]">Quick Signup</h3>
                      <p className="text-[#a3a3a3] text-sm mb-1">
                        Create your account instantly with email and password
                      </p>
                      <div className="flex items-center text-[#3b82f6] text-sm font-medium">
                        Get started now
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/signup/otp">
              <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-2 hover:border-[#10b981] bg-[#1a1a1a] border-[#262626] mb-6">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-[#262626] p-2 rounded-lg">
                      <Mail className="h-5 w-5 text-[#10b981]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1 text-[#fafafa]">Email Verification</h3>
                      <p className="text-[#a3a3a3] text-sm mb-1">
                        Verify your email first, then set your password securely
                      </p>
                      <div className="flex items-center text-[#10b981] text-sm font-medium">
                        Start with email
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#262626]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#171717] px-2 text-[#71717a]">Or</span>
              </div>
            </div>

            <div className="text-center text-sm text-[#a3a3a3]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[#3b82f6] hover:text-[#2563eb] hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
