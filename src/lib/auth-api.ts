import axios, { AxiosInstance, AxiosError } from 'axios'
import { API_CONFIG } from '@/lib/config'
import {
  LoginFormData,
  TraditionalSignupFormData,
  OtpSignupFormData,
  OtpVerificationFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  AuthResponse,
  ApiResponse,
  User
} from '@/lib/auth-types'

class AuthAPI {
  private api: AxiosInstance
  private tokenKey = 'auth_token'
  private rememberKey = 'auth_remember'

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.AUTH_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.removeToken()
          // Redirect to login if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Token management
  setToken(token: string, rememberMe = false): void {
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        // Store in localStorage for persistent storage
        localStorage.setItem(this.tokenKey, token)
        localStorage.setItem(this.rememberKey, 'true')
        sessionStorage.removeItem(this.tokenKey)

        // Set cookie for middleware (expires in 30 days)
        document.cookie = `auth_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=strict`
      } else {
        // Store in sessionStorage for current session only
        sessionStorage.setItem(this.tokenKey, token)
        localStorage.removeItem(this.tokenKey)
        localStorage.removeItem(this.rememberKey)

        // Set session cookie for middleware
        document.cookie = `auth_token=${token}; path=/; SameSite=strict`
      }
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null

    // First check session storage
    const sessionToken = sessionStorage.getItem(this.tokenKey)
    if (sessionToken) return sessionToken

    // Then check localStorage if remember me was used
    const rememberMe = localStorage.getItem(this.rememberKey)
    if (rememberMe === 'true') {
      const localToken = localStorage.getItem(this.tokenKey)
      if (localToken) return localToken
    }

    return null
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.rememberKey)

      // Remove cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=strict'
    }
  }

  // Authentication methods
  async login(data: LoginFormData): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', data)

      if (response.data.success && response.data.data?.access_token) {
        this.setToken(response.data.data.access_token, data.remember_me)
      }

      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async traditionalSignup(data: TraditionalSignupFormData): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/signup/form', {
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        first_name: data.firstName,
        last_name: data.lastName,
      })

      if (response.data.success && response.data.data?.access_token) {
        this.setToken(response.data.data.access_token)
      }

      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async otpSignup(data: OtpSignupFormData): Promise<ApiResponse> {
    try {
      const response = await this.api.post<ApiResponse>('/auth/send-otp', data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async verifyOTP(data: OtpVerificationFormData): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/verify-otp', {
        email: data.email,
        otp: data.otp,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      })

      if (response.data.success && response.data.data?.access_token) {
        this.setToken(response.data.data.access_token)
      }

      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async forgotPassword(data: ForgotPasswordFormData): Promise<ApiResponse> {
    try {
      const response = await this.api.post<ApiResponse>('/auth/forgot-password', data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async resetPassword(data: ResetPasswordFormData): Promise<ApiResponse> {
    try {
      const response = await this.api.post<ApiResponse>('/auth/reset-password', {
        token: data.token,
        new_password: data.newPassword,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get<ApiResponse<User>>('/auth/me')
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error('Failed to get user data')
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async validateToken(): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await this.api.get<ApiResponse<User>>('/auth/validate-token')
      if (response.data.success && response.data.data) {
        return { valid: true, user: response.data.data }
      }
      return { valid: false }
    } catch (error) {
      return { valid: false }
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      this.removeToken()
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred'
      return new Error(message)
    }
    return new Error('An unexpected error occurred')
  }
}

export const authAPI = new AuthAPI()
