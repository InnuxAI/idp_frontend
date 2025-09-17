'use client'

import { useState } from 'react'
import { OTPSignupForm } from '@/components/auth/OTPSignupForm'
import { OTPVerification } from '@/components/auth/OTPVerification'

export default function OTPSignupPage() {
  const [email, setEmail] = useState<string>('')
  const [showVerification, setShowVerification] = useState(false)

  const handleOTPSent = (emailAddress: string) => {
    setEmail(emailAddress)
    setShowVerification(true)
  }

  const handleResendOTP = async () => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        // Show success message
        console.log('OTP resent successfully')
      } else {
        console.error('Failed to resend OTP')
      }
    } catch (error) {
      console.error('Error resending OTP:', error)
    }
  }

  return (
    <>
      {!showVerification ? (
        <OTPSignupForm onOTPSent={handleOTPSent} />
      ) : (
        <OTPVerification
          email={email}
          onResendOTP={handleResendOTP}
        />
      )}
    </>
  )
}
