'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { authAPI } from '@/lib/auth-api'
import { 
  User, 
  AuthContextType,
  LoginFormData,
  TraditionalSignupFormData,
  OtpSignupFormData,
  OtpVerificationFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData
} from '@/lib/auth-types'
import { toast } from 'sonner'

// Auth state
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Auth actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'LOGOUT' }

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        isLoading: false 
      }
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload }
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false }
    default:
      return state
  }
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      try {
        const token = authAPI.getToken()
        if (!token) {
          dispatch({ type: 'SET_LOADING', payload: false })
          return
        }

        // Validate token and get user data
        const result = await authAPI.validateToken()
        if (result.valid && result.user) {
          dispatch({ type: 'SET_USER', payload: result.user })
        } else {
          authAPI.removeToken()
          dispatch({ type: 'LOGOUT' })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        authAPI.removeToken()
        dispatch({ type: 'LOGOUT' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await authAPI.login({ email, password, remember_me: rememberMe })
      
      if (response.success && response.data?.user) {
        dispatch({ type: 'SET_USER', payload: response.data.user })
        toast.success('Login successful!')
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout()
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Still logout locally even if API call fails
      dispatch({ type: 'LOGOUT' })
    }
  }

  // Traditional signup function
  const traditionalSignup = async (email: string, password: string, confirmPassword: string, firstName: string, lastName: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await authAPI.traditionalSignup({ 
        email, 
        password, 
        confirmPassword, 
        firstName, 
        lastName 
      })
      
      if (response.success) {
        // Check if account is pending approval
        if (response.data?.status === 'pending_approval') {
          toast.success('Account created successfully! Please wait for admin approval.', {
            duration: 5000
          })
          // Don't set user since account is pending
          return { success: true, pending: true }
        } else if (response.data?.user) {
          // Account was immediately approved
          dispatch({ type: 'SET_USER', payload: response.data.user })
          toast.success('Account created successfully!')
          return { success: true, pending: false }
        }
      } else {
        throw new Error(response.message || 'Signup failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Signup failed')
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // OTP signup function
  const otpSignup = async (email: string) => {
    try {
      const response = await authAPI.otpSignup({ email })
      
      if (response.success) {
        toast.success('OTP sent to your email!')
      } else {
        throw new Error(response.message || 'Failed to send OTP')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP')
      throw error
    }
  }

  // Verify OTP function
  const verifyOTP = async (email: string, otp: string, password: string, firstName: string, lastName: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await authAPI.verifyOTP({ email, otp, password, firstName, lastName })
      
      if (response.success) {
        // Check if account is pending approval
        if (response.data?.status === 'pending_approval') {
          toast.success('Account created successfully! Please wait for admin approval.', {
            duration: 5000
          })
          return { success: true, pending: true }
        } else if (response.data?.user) {
          dispatch({ type: 'SET_USER', payload: response.data.user })
          toast.success('Account created successfully!')
          return { success: true, pending: false }
        }
      } else {
        throw new Error(response.message || 'OTP verification failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed')
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Reset password function
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await authAPI.resetPassword({ 
        token, 
        newPassword, 
        confirmPassword: newPassword 
      })
      
      if (response.success) {
        toast.success('Password reset successfully!')
      } else {
        throw new Error(response.message || 'Password reset failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Password reset failed')
      throw error
    }
  }

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      const response = await authAPI.forgotPassword({ email })
      
      if (response.success) {
        toast.success('Reset link sent to your email!')
      } else {
        throw new Error(response.message || 'Failed to send reset link')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link')
      throw error
    }
  }

  // Update user function
  const updateUser = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user })
  }

  // Check permission function
  const checkPermission = (permission: string): boolean => {
    if (!state.user || !state.user.permissions) return false
    return state.user.permissions.includes(permission)
  }

  const contextValue: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
    traditionalSignup,
    otpSignup,
    verifyOTP,
    resetPassword,
    forgotPassword,
    updateUser,
    checkPermission,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to check if user has permission
export function usePermission(permission: string): boolean {
  const { checkPermission } = useAuth()
  return checkPermission(permission)
}

// Hook to get user role
export function useRole(): string | null {
  const { user } = useAuth()
  return user?.role || null
}
