import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
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
  private refreshTokenKey = 'refresh_token'
  private rememberKey = 'auth_remember'
  private isRefreshing = false
  private refreshSubscribers: ((token: string) => void)[] = []

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

    // Response interceptor to handle 401 errors with token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // If 401 and we haven't already retried and it's not the refresh endpoint
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh') &&
          !originalRequest.url?.includes('/auth/login')
        ) {
          originalRequest._retry = true

          // If already refreshing, wait for the refresh to complete
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                resolve(this.api(originalRequest))
              })
            })
          }

          this.isRefreshing = true

          try {
            const newToken = await this.refreshAccessToken()

            if (newToken) {
              // Notify all waiting requests
              this.refreshSubscribers.forEach((callback) => callback(newToken))
              this.refreshSubscribers = []

              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.removeAllTokens()
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        // For other 401 errors (refresh failed, login failed, etc.)
        if (error.response?.status === 401) {
          this.removeAllTokens()
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

  setRefreshToken(token: string, rememberMe = false): void {
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem(this.refreshTokenKey, token)
        sessionStorage.removeItem(this.refreshTokenKey)
      } else {
        sessionStorage.setItem(this.refreshTokenKey, token)
        localStorage.removeItem(this.refreshTokenKey)
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

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null

    // First check session storage
    const sessionToken = sessionStorage.getItem(this.refreshTokenKey)
    if (sessionToken) return sessionToken

    // Then check localStorage if remember me was used
    const rememberMe = localStorage.getItem(this.rememberKey)
    if (rememberMe === 'true') {
      const localToken = localStorage.getItem(this.refreshTokenKey)
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

  removeAllTokens(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.tokenKey)
      sessionStorage.removeItem(this.refreshTokenKey)
      sessionStorage.removeItem('cached_user')
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.refreshTokenKey)
      localStorage.removeItem(this.rememberKey)

      // Remove cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=strict'
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()

    if (!refreshToken) {
      return null
    }

    try {
      const response = await this.api.post<{ success: boolean; data?: { access_token: string } }>(
        '/auth/refresh',
        { refresh_token: refreshToken }
      )

      if (response.data.success && response.data.data?.access_token) {
        const rememberMe = localStorage.getItem(this.rememberKey) === 'true'
        this.setToken(response.data.data.access_token, rememberMe)
        return response.data.data.access_token
      }

      return null
    } catch (error) {
      console.warn('Token refresh failed:', error)
      return null
    }
  }

  // Authentication methods
  async login(data: LoginFormData): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', data)

      if (response.data.success && response.data.data?.access_token) {
        // Clear any stale cached user from previous session
        this.clearCachedUser()

        this.setToken(response.data.data.access_token, data.remember_me)

        // Store refresh token if provided
        if (response.data.data?.refresh_token) {
          this.setRefreshToken(response.data.data.refresh_token, data.remember_me)
        }

        // Cache the new user data
        if (response.data.data?.user) {
          this.setCachedUser(response.data.data.user as User)
        }
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

  // Check if token is expired client-side (without backend call)
  isTokenExpired(token: string): boolean {
    try {
      // JWT structure: header.payload.signature
      const payload = token.split('.')[1]
      if (!payload) return true

      const decoded = JSON.parse(atob(payload))
      const exp = decoded.exp

      if (!exp) return true

      // Check if expired (with 30 second buffer)
      return Date.now() >= (exp * 1000) - 30000
    } catch {
      return true
    }
  }

  // Get cached user data
  getCachedUser(): User | null {
    if (typeof window === 'undefined') return null

    try {
      const cached = sessionStorage.getItem('cached_user')
      if (cached) {
        return JSON.parse(cached)
      }
    } catch {
      // Ignore parsing errors
    }
    return null
  }

  // Cache user data
  setCachedUser(user: User): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cached_user', JSON.stringify(user))
    }
  }

  // Clear cached user
  clearCachedUser(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cached_user')
    }
  }

  async validateToken(): Promise<{ valid: boolean; user?: User }> {
    const token = this.getToken()

    // No token = not authenticated
    if (!token) {
      return { valid: false }
    }

    // Check if token is expired client-side (fast, no backend call)
    if (this.isTokenExpired(token)) {
      // Try to refresh the token
      const newToken = await this.refreshAccessToken()
      if (!newToken) {
        this.clearCachedUser()
        return { valid: false }
      }
    }

    // Check for cached user data first (avoid backend call on navigation)
    const cachedUser = this.getCachedUser()
    if (cachedUser) {
      return { valid: true, user: cachedUser }
    }

    // Only call backend if we have no cached user
    try {
      const response = await this.api.get<ApiResponse<User>>('/auth/validate-token')
      if (response.data.success && response.data.data) {
        // Cache the user data
        this.setCachedUser(response.data.data)
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
      this.removeAllTokens()
    }
  }

  // Admin methods
  async adminCreateUser(data: {
    email: string
    first_name: string
    last_name: string
    role: string
    auth_method: string
    password?: string
  }): Promise<ApiResponse> {
    try {
      const response = await this.api.post<ApiResponse>('/auth/admin/create-user', data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Microsoft OAuth methods
  async loginWithMicrosoft(): Promise<string> {
    /**
     * Initiate Microsoft OAuth login flow
     * Returns the authorization URL to redirect the user to
     */
    try {
      const response = await this.api.get<ApiResponse<{ authorization_url: string; state: string }>>('/auth/microsoft/login')

      if (response.data.success && response.data.data?.authorization_url) {
        // Store state for CSRF protection (optional)
        if (response.data.data.state) {
          sessionStorage.setItem('microsoft_oauth_state', response.data.data.state)
        }
        return response.data.data.authorization_url
      }

      throw new Error('Failed to get Microsoft authorization URL')
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async handleMicrosoftCallback(code: string, state?: string): Promise<AuthResponse> {
    /**
     * Handle Microsoft OAuth callback
     * Exchanges the authorization code for our JWT tokens
     */
    try {
      const response = await this.api.get<AuthResponse>('/auth/microsoft/callback', {
        params: { code, state }
      })

      if (response.data.success && response.data.data?.access_token) {
        // Clear any stale cached user from previous session
        this.clearCachedUser()

        // Store tokens (Microsoft users are auto-approved, so no remember_me needed)
        this.setToken(response.data.data.access_token, false)

        // Store refresh token if provided
        if (response.data.data.refresh_token) {
          this.setRefreshToken(response.data.data.refresh_token, false)
        }

        // Cache the new user data so validateToken doesn't return stale data
        if (response.data.data.user) {
          this.setCachedUser(response.data.data.user as User)
        }

        // Clear OAuth state
        sessionStorage.removeItem('microsoft_oauth_state')
      }

      return response.data
    } catch (error) {
      throw this.handleError(error)
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
