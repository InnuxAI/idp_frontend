import { z } from "zod"

// User types
export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: string
  is_active: boolean
  approval_status?: string
  created_at: string
  permissions: string[]
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    access_token?: string
    refresh_token?: string
    token_type?: string
    user?: User
    status?: string
    user_id?: string
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

// Authentication context types
export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => void
  traditionalSignup: (email: string, password: string, confirmPassword: string, firstName: string, lastName: string) => Promise<{ success: boolean; pending: boolean } | undefined>
  otpSignup: (email: string) => Promise<void>
  verifyOTP: (email: string, otp: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; pending: boolean } | undefined>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  updateUser: (user: User) => void
  checkPermission: (permission: string) => boolean
}

// Form validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember_me: z.boolean().default(false),
})

export const traditionalSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const otpSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const otpVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Form types
export type LoginFormData = z.infer<typeof loginSchema>
export type TraditionalSignupFormData = z.infer<typeof traditionalSignupSchema>
export type OtpSignupFormData = z.infer<typeof otpSignupSchema>
export type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// Permission constants
export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_SCHEMAS: "view_schemas",
  CREATE_SCHEMAS: "create_schemas",
  EDIT_SCHEMAS: "edit_schemas",
  DELETE_SCHEMAS: "delete_schemas",
  VIEW_EXTRACTIONS: "view_extractions",
  CREATE_EXTRACTIONS: "create_extractions",
  EDIT_EXTRACTIONS: "edit_extractions",
  DELETE_EXTRACTIONS: "delete_extractions",
  VIEW_DATA_LIBRARY: "view_data_library",
  MANAGE_USERS: "manage_users",
  VIEW_ANALYTICS: "view_analytics",
  UPLOAD_DOCUMENTS: "upload_documents",
  DOWNLOAD_DOCUMENTS: "download_documents",
  APPROVE_EXTRACTIONS: "approve_extractions",
  PERFORM_TWO_WAY_MATCH: "perform_two_way_match",
  SYSTEM_ADMIN: "system_admin",
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]
