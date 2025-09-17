'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserPlus, MoreHorizontal, Check, X, Filter, Trash2, Settings } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  approval_status: string
  signup_type: string
  is_active: boolean
  created_at: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const approveUser = async (userId: string) => {
    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/approve-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('User approved successfully')
        fetchUsers() // Refresh the list
      } else {
        toast.error('Failed to approve user')
      }
    } catch (error) {
      console.error('Error approving user:', error)
      toast.error('Failed to approve user')
    }
  }

  const rejectUser = async (userId: string) => {
    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/reject-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('User rejected successfully')
        fetchUsers() // Refresh the list
      } else {
        toast.error('Failed to reject user')
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
      toast.error('Failed to reject user')
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/update-user-role/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast.success(`User role updated to ${newRole} successfully`)
        fetchUsers() // Refresh the list
      } else {
        toast.error('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    // Double confirmation for safety
    const firstConfirm = confirm(`Are you sure you want to permanently delete user: ${userEmail}?`)
    if (!firstConfirm) return

    const secondConfirm = confirm('This action cannot be undone. Are you absolutely sure?')
    if (!secondConfirm) return

    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        fetchUsers() // Refresh the list
      } else {
        toast.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'pending') {
      return <Badge variant="outline" className="bg-[#171717] text-[#fafafa] border-[#262626]">Pending</Badge>
    } else if (status === 'approved' && isActive) {
      return <Badge variant="outline" className="bg-[#171717] text-[#10b981] border-[#10b981]">Active</Badge>
    } else if (status === 'rejected') {
      return <Badge variant="outline" className="bg-[#171717] text-red-400 border-red-400">Rejected</Badge>
    } else {
      return <Badge variant="outline" className="bg-[#171717] text-[#71717a] border-[#404040]">Inactive</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return type === 'traditional' 
      ? <Badge variant="secondary" className="bg-[#262626] text-[#a3a3a3]">Form</Badge>
      : <Badge variant="outline" className="bg-[#171717] text-[#3b82f6] border-[#3b82f6]">OTP</Badge>
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(filter.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(filter.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(filter.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#fafafa]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-[#a3a3a3] hover:text-[#fafafa] hover:bg-[#262626]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-[#fafafa]">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-[#fafafa]">User Management</h1>
          <p className="text-[#a3a3a3]">Manage user registrations and permissions</p>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717a]" />
              <Input
                placeholder="Filter emails..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 bg-[#262626] border-[#404040] text-[#fafafa] placeholder:text-[#71717a] focus:border-[#3b82f6]"
              />
            </div>
            <Button variant="outline" size="sm" className="border-[#404040] text-[#a3a3a3] hover:bg-[#262626] hover:text-[#fafafa]">
              <Filter className="h-4 w-4 mr-2" />
              Customize Columns
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card className="bg-[#171717] border-[#262626]">
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#a3a3a3] mb-4">No users found</p>
                <Button variant="outline" onClick={fetchUsers} className="border-[#404040] text-[#a3a3a3] hover:bg-[#262626] hover:text-[#fafafa]">
                  Retry Fetch
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#262626] hover:bg-[#1a1a1a]">
                    <TableHead className="text-[#a3a3a3]">Email</TableHead>
                    <TableHead className="text-[#a3a3a3]">Type</TableHead>
                    <TableHead className="text-[#a3a3a3]">Role</TableHead>
                    <TableHead className="text-[#a3a3a3]">Status</TableHead>
                    <TableHead className="text-[#a3a3a3]">Joined</TableHead>
                    <TableHead className="text-[#a3a3a3] w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-[#262626] hover:bg-[#1a1a1a]">
                      <TableCell className="text-[#fafafa]">
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.first_name && user.last_name && (
                            <div className="text-sm text-[#a3a3a3]">
                              {user.first_name} {user.last_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(user.signup_type)}</TableCell>
                      <TableCell className="text-[#a3a3a3] capitalize">
                        {user.role || <span className="text-[#71717a] italic">No role assigned</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.approval_status, user.is_active)}</TableCell>
                      <TableCell className="text-[#a3a3a3]">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-[#71717a] hover:text-[#fafafa] hover:bg-[#262626]">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#171717] border-[#262626]">
                            {user.approval_status === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => approveUser(user.id)}
                                  className="text-[#10b981] focus:text-[#10b981] focus:bg-[#262626]"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => rejectUser(user.id)}
                                  className="text-red-400 focus:text-red-300 focus:bg-[#262626]"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {/* Role Management */}
                            <div className="px-2 py-1.5">
                              <label className="text-xs text-[#a3a3a3] mb-1 block">Update Role:</label>
                              <Select onValueChange={(value) => updateUserRole(user.id, value)}>
                                <SelectTrigger className="w-full h-8 bg-[#262626] border-[#404040] text-[#fafafa]">
                                  <SelectValue placeholder={user.role || "No role"} />
                                </SelectTrigger>
                                <SelectContent className="bg-[#171717] border-[#262626]">
                                  <SelectItem value="admin" className="text-[#fafafa] focus:bg-[#262626]">Admin</SelectItem>
                                  <SelectItem value="user" className="text-[#fafafa] focus:bg-[#262626]">User</SelectItem>
                                  <SelectItem value="viewer" className="text-[#fafafa] focus:bg-[#262626]">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <DropdownMenuItem className="text-[#a3a3a3] focus:text-[#fafafa] focus:bg-[#262626]">
                              <Settings className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {/* Delete User - Only show if not admin */}
                            {user.role !== 'admin' && (
                              <DropdownMenuItem 
                                onClick={() => deleteUser(user.id, user.email)}
                                className="text-red-400 focus:text-red-300 focus:bg-[#262626]"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#a3a3a3]">
            {filteredUsers.length} of {users.length} row(s) selected.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#a3a3a3]">Rows per page</span>
            <select 
              className="bg-[#262626] border-[#404040] text-[#fafafa] text-sm rounded px-2 py-1"
              aria-label="Rows per page"
            >
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
            <span className="text-sm text-[#a3a3a3]">Page 1 of {Math.ceil(users.length / 10)}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="border-[#404040] text-[#a3a3a3] hover:bg-[#262626] hover:text-[#fafafa]">
                ←
              </Button>
              <Button variant="outline" size="sm" className="border-[#404040] text-[#a3a3a3] hover:bg-[#262626] hover:text-[#fafafa]">
                →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
