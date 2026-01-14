'use client'

import { useState, useEffect } from 'react'
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, MoreHorizontal, Pencil, Trash2, Shield, Users, Lock } from "lucide-react"
import { toast } from "sonner"
import { roleAPI, Role, AvailablePermission } from "@/lib/role-api"
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

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [availablePermissions, setAvailablePermissions] = useState<AvailablePermission[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)

    // Form state
    const [formName, setFormName] = useState('')
    const [formDescription, setFormDescription] = useState('')
    const [formPermissions, setFormPermissions] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [rolesData, permissionsData] = await Promise.all([
                roleAPI.listRoles(),
                roleAPI.getAvailablePermissions()
            ])
            setRoles(rolesData)
            setAvailablePermissions(permissionsData)
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load roles')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormName('')
        setFormDescription('')
        setFormPermissions([])
    }

    const openCreate = () => {
        resetForm()
        setIsCreateOpen(true)
    }

    const openEdit = (role: Role) => {
        setEditingRole(role)
        setFormName(role.name)
        setFormDescription(role.description)
        setFormPermissions(role.permissions)
        setIsEditOpen(true)
    }

    const handlePermissionToggle = (permissionId: string) => {
        setFormPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(p => p !== permissionId)
                : [...prev, permissionId]
        )
    }

    const handleSelectAll = () => {
        if (formPermissions.length === availablePermissions.length) {
            setFormPermissions([])
        } else {
            setFormPermissions(availablePermissions.map(p => p.id))
        }
    }

    const handleCreate = async () => {
        if (!formName.trim()) {
            toast.error('Role name is required')
            return
        }
        if (formPermissions.length === 0) {
            toast.error('Select at least one page permission')
            return
        }

        setSaving(true)
        try {
            await roleAPI.createRole({
                name: formName.trim(),
                description: formDescription.trim(),
                permissions: formPermissions
            })
            toast.success(`Role "${formName}" created successfully`)
            setIsCreateOpen(false)
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create role')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdate = async () => {
        if (!editingRole) return
        if (!formName.trim()) {
            toast.error('Role name is required')
            return
        }
        if (formPermissions.length === 0) {
            toast.error('Select at least one page permission')
            return
        }

        setSaving(true)
        try {
            await roleAPI.updateRole(editingRole.id, {
                name: editingRole.is_system_role ? undefined : formName.trim(),
                description: formDescription.trim(),
                permissions: formPermissions
            })
            toast.success(`Role "${formName}" updated successfully`)
            setIsEditOpen(false)
            setEditingRole(null)
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to update role')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (role: Role) => {
        if (role.is_system_role) {
            toast.error('Cannot delete system roles')
            return
        }
        if ((role.user_count || 0) > 0) {
            toast.error(`Cannot delete role: ${role.user_count} user(s) are assigned to this role`)
            return
        }

        const confirmed = confirm(`Are you sure you want to delete the role "${role.name}"?`)
        if (!confirmed) return

        try {
            await roleAPI.deleteRole(role.id)
            toast.success(`Role "${role.name}" deleted successfully`)
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete role')
        }
    }

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
                                        <BreadcrumbLink href="/admin" className="dark:text-zinc-400 dark:hover:text-zinc-200">
                                            Admin
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                                    <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="dark:text-zinc-100">Role Management</BreadcrumbPage>
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
                                        <Shield className="h-8 w-8" />
                                        Role Management
                                    </h1>
                                    <p className="text-muted-foreground">Create and manage roles with page-level permissions</p>
                                </div>
                                <Button onClick={openCreate}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Role
                                </Button>
                            </div>

                            {/* Loading State */}
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-foreground">Loading...</div>
                                </div>
                            ) : (
                                /* Roles Table */
                                <Card>
                                    <CardContent className="p-0">
                                        {roles.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                <p className="text-muted-foreground mb-4">No roles found</p>
                                                <Button onClick={openCreate}>Create your first role</Button>
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Role Name</TableHead>
                                                        <TableHead>Description</TableHead>
                                                        <TableHead>Permissions</TableHead>
                                                        <TableHead>Users</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {roles.map((role) => (
                                                        <TableRow key={role.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium capitalize">{role.name}</span>
                                                                    {role.is_system_role && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            <Lock className="h-3 w-3 mr-1" />
                                                                            System
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground max-w-xs truncate">
                                                                {role.description || <span className="italic">No description</span>}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{role.permissions.length} pages</Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                                    <Users className="h-4 w-4" />
                                                                    <span>{role.user_count || 0}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => openEdit(role)}>
                                                                            <Pencil className="h-4 w-4 mr-2" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                        {!role.is_system_role && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleDelete(role)}
                                                                                className="text-destructive focus:text-destructive"
                                                                            >
                                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                                Delete
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
                        </div>
                    </div>
                </div>
            </SidebarInset>

            {/* Create Role Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>
                            Define a new role with specific page access permissions
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Role Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Analyst, Manager"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe what this role is for..."
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Page Access</Label>
                                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                                    {formPermissions.length === availablePermissions.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            <div className="border rounded-lg p-3 space-y-3 max-h-64 overflow-y-auto">
                                {availablePermissions.map((permission) => (
                                    <div key={permission.id} className="flex items-start gap-3">
                                        <Checkbox
                                            id={permission.id}
                                            checked={formPermissions.includes(permission.id)}
                                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                                        />
                                        <div className="grid gap-0.5">
                                            <Label htmlFor={permission.id} className="cursor-pointer font-medium">
                                                {permission.name}
                                            </Label>
                                            <span className="text-xs text-muted-foreground">
                                                {permission.description}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={saving}>
                            {saving ? 'Creating...' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
                        <DialogDescription>
                            {editingRole?.is_system_role
                                ? 'System role - name cannot be changed, but permissions can be modified'
                                : 'Modify role name, description, and permissions'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Role Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="Role name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                disabled={editingRole?.is_system_role}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                placeholder="Describe what this role is for..."
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Page Access</Label>
                                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                                    {formPermissions.length === availablePermissions.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            <div className="border rounded-lg p-3 space-y-3 max-h-64 overflow-y-auto">
                                {availablePermissions.map((permission) => (
                                    <div key={permission.id} className="flex items-start gap-3">
                                        <Checkbox
                                            id={`edit-${permission.id}`}
                                            checked={formPermissions.includes(permission.id)}
                                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                                        />
                                        <div className="grid gap-0.5">
                                            <Label htmlFor={`edit-${permission.id}`} className="cursor-pointer font-medium">
                                                {permission.name}
                                            </Label>
                                            <span className="text-xs text-muted-foreground">
                                                {permission.description}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    )
}
