import axios from 'axios'
import { API_CONFIG } from '@/lib/config'

/**
 * Role type matching backend RoleResponse
 */
export interface Role {
    id: string
    name: string
    description: string
    permissions: string[]
    is_system_role: boolean
    created_at: string
    updated_at: string
    user_count?: number
}

export interface RoleCreate {
    name: string
    description: string
    permissions: string[]
}

export interface RoleUpdate {
    name?: string
    description?: string
    permissions?: string[]
}

export interface AvailablePermission {
    id: string
    name: string
    description: string
}

interface ApiResponse<T> {
    success: boolean
    message?: string
    data?: T
}

class RoleAPI {
    private getToken(): string | null {
        if (typeof window === 'undefined') return null
        return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
    }

    private getHeaders() {
        const token = this.getToken()
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
    }

    async listRoles(): Promise<Role[]> {
        const response = await axios.get<ApiResponse<Role[]>>(
            `${API_CONFIG.AUTH_BASE_URL}/roles`,
            { headers: this.getHeaders() }
        )
        return response.data.data || []
    }

    async getRole(roleId: string): Promise<Role> {
        const response = await axios.get<ApiResponse<Role>>(
            `${API_CONFIG.AUTH_BASE_URL}/roles/${roleId}`,
            { headers: this.getHeaders() }
        )
        if (!response.data.data) {
            throw new Error('Role not found')
        }
        return response.data.data
    }

    async createRole(roleData: RoleCreate): Promise<Role> {
        const response = await axios.post<ApiResponse<Role>>(
            `${API_CONFIG.AUTH_BASE_URL}/roles`,
            roleData,
            { headers: this.getHeaders() }
        )
        if (!response.data.data) {
            throw new Error(response.data.message || 'Failed to create role')
        }
        return response.data.data
    }

    async updateRole(roleId: string, roleData: RoleUpdate): Promise<Role> {
        const response = await axios.put<ApiResponse<Role>>(
            `${API_CONFIG.AUTH_BASE_URL}/roles/${roleId}`,
            roleData,
            { headers: this.getHeaders() }
        )
        if (!response.data.data) {
            throw new Error(response.data.message || 'Failed to update role')
        }
        return response.data.data
    }

    async deleteRole(roleId: string): Promise<void> {
        await axios.delete(
            `${API_CONFIG.AUTH_BASE_URL}/roles/${roleId}`,
            { headers: this.getHeaders() }
        )
    }

    async getAvailablePermissions(): Promise<AvailablePermission[]> {
        const response = await axios.get<ApiResponse<AvailablePermission[]>>(
            `${API_CONFIG.AUTH_BASE_URL}/roles/available-permissions`,
            { headers: this.getHeaders() }
        )
        return response.data.data || []
    }

    async initializeDefaultRoles(): Promise<void> {
        await axios.post(
            `${API_CONFIG.AUTH_BASE_URL}/roles/initialize-defaults`,
            {},
            { headers: this.getHeaders() }
        )
    }
}

export const roleAPI = new RoleAPI()
