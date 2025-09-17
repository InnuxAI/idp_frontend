// API Configuration
export const API_CONFIG = {
  // Main API for document services
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // Auth API with /api/v1 prefix
  AUTH_BASE_URL: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8000/api/v1',
} as const
