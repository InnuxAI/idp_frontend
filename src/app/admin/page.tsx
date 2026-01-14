'use client'

import { useState, useEffect } from 'react'
import { motion } from "motion/react"
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
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, MoreHorizontal, Check, X, Filter, Trash2, Settings, Users } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

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
        fetchUsers()
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
        fetchUsers()
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
        fetchUsers()
      } else {
        toast.error('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
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
        fetchUsers()
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
      return <Badge variant="outline" className="bg-muted text-foreground border-border">Pending</Badge>
    } else if (status === 'approved' && isActive) {
      return <Badge variant="outline" className="bg-muted text-emerald-500 border-emerald-500">Active</Badge>
    } else if (status === 'rejected') {
      return <Badge variant="outline" className="bg-muted text-red-400 border-red-400">Rejected</Badge>
    } else {
      return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Inactive</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return type === 'traditional'
      ? <Badge variant="secondary">Form</Badge>
      : <Badge variant="outline" className="text-blue-500 border-blue-500">OTP</Badge>
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(filter.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(filter.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard" className="dark:text-zinc-400 dark:hover:text-zinc-200">
                      Platform
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                  <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="dark:text-zinc-100">Admin Panel</BreadcrumbPage>
                  </BreadcrumbItem>
                </motion.div>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <Users className="h-8 w-8" />
                    User Management
                  </h1>
                  <p className="text-muted-foreground">Manage user registrations and permissions</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/admin/roles" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Manage Roles
                    </Link>
                  </Button>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter emails..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Customize Columns
                </Button>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-foreground">Loading...</div>
                </div>
              ) : (
                /* Users Table */
                <Card>
                  <CardContent className="p-0">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">No users found</p>
                        <Button variant="outline" onClick={fetchUsers}>
                          Retry Fetch
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{user.email}</div>
                                  {user.first_name && user.last_name && (
                                    <div className="text-sm text-muted-foreground">
                                      {user.first_name} {user.last_name}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getTypeBadge(user.signup_type)}</TableCell>
                              <TableCell className="text-muted-foreground capitalize">
                                {user.role || <span className="italic">No role assigned</span>}
                              </TableCell>
                              <TableCell>{getStatusBadge(user.approval_status, user.is_active)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {user.approval_status === 'pending' && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => approveUser(user.id)}
                                          className="text-emerald-500 focus:text-emerald-500"
                                        >
                                          <Check className="h-4 w-4 mr-2" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => rejectUser(user.id)}
                                          className="text-red-400 focus:text-red-400"
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {/* Role Management */}
                                    <div className="px-2 py-1.5">
                                      <label className="text-xs text-muted-foreground mb-1 block">Update Role:</label>
                                      <Select onValueChange={(value) => updateUserRole(user.id, value)}>
                                        <SelectTrigger className="w-full h-8">
                                          <SelectValue placeholder={user.role || "No role"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">Admin</SelectItem>
                                          <SelectItem value="user">User</SelectItem>
                                          <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <DropdownMenuItem>
                                      <Settings className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>

                                    {/* Delete User - Only show if not admin */}
                                    {user.role !== 'admin' && (
                                      <DropdownMenuItem
                                        onClick={() => deleteUser(user.id, user.email)}
                                        className="text-destructive focus:text-destructive"
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
              )}

              {/* Pagination */}
              {!loading && filteredUsers.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredUsers.length} of {users.length} row(s) selected.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <select
                      className="bg-background border border-input text-foreground text-sm rounded px-2 py-1"
                      aria-label="Rows per page"
                    >
                      <option>10</option>
                      <option>20</option>
                      <option>50</option>
                    </select>
                    <span className="text-sm text-muted-foreground">Page 1 of {Math.ceil(users.length / 10)}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        ←
                      </Button>
                      <Button variant="outline" size="sm">
                        →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
