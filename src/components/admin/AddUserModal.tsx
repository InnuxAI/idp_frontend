'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { UserPlus, Loader2, Eye, EyeOff, Search, User } from "lucide-react"
import { toast } from "sonner"
import { authAPI } from "@/lib/auth-api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8000/api/v1'

interface Role {
    id: string
    name: string
    description?: string
}

interface OrgUser {
    email: string
    first_name: string
    last_name: string
    display_name: string
    microsoft_id: string
}

interface AddUserModalProps {
    onUserCreated?: () => void
}

export function AddUserModal({ onUserCreated }: AddUserModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<Role[]>([])
    const [showPassword, setShowPassword] = useState(false)

    // Form state
    const [email, setEmail] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [role, setRole] = useState('')
    const [authMethod, setAuthMethod] = useState('traditional')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Org search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<OrgUser[]>([])
    const [searching, setSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (open) {
            fetchRoles()
        }
    }, [open])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchRoles = async () => {
        try {
            const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
            const response = await fetch(`${API_BASE_URL}/api/v1/roles`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                setRoles(data.data || [])
                if (data.data?.length > 0 && !role) {
                    const userRole = data.data.find((r: Role) => r.name === 'user')
                    setRole(userRole?.name || data.data[0].name)
                }
            }
        } catch (error) {
            console.error('Error fetching roles:', error)
        }
    }

    const searchOrgUsers = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([])
            setShowDropdown(false)
            return
        }

        setSearching(true)
        try {
            const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
            const response = await fetch(
                `${AUTH_API_BASE_URL}/auth/microsoft/search-users?q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (response.ok) {
                const data = await response.json()
                setSearchResults(data.data || [])
                setShowDropdown(true)
            }
        } catch (error) {
            console.error('Error searching org users:', error)
            setSearchResults([])
        } finally {
            setSearching(false)
        }
    }, [])

    const handleSearchInput = (value: string) => {
        setSearchQuery(value)
        setEmail(value)

        // Debounce the search
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }

        if (authMethod === 'microsoft' && value.length >= 2) {
            debounceTimer.current = setTimeout(() => {
                searchOrgUsers(value)
            }, 300)
        } else {
            setSearchResults([])
            setShowDropdown(false)
        }
    }

    const selectOrgUser = (user: OrgUser) => {
        setEmail(user.email)
        setSearchQuery(user.email)
        setFirstName(user.first_name)
        setLastName(user.last_name)
        setShowDropdown(false)
        setSearchResults([])
    }

    const resetForm = () => {
        setEmail('')
        setFirstName('')
        setLastName('')
        setRole('')
        setAuthMethod('traditional')
        setPassword('')
        setConfirmPassword('')
        setSearchQuery('')
        setSearchResults([])
        setShowDropdown(false)
        setErrors({})
        setShowPassword(false)
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!email) {
            newErrors.email = 'Email is required'
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            newErrors.email = 'Invalid email format'
        }

        if (!firstName.trim()) newErrors.firstName = 'First name is required'
        if (!lastName.trim()) newErrors.lastName = 'Last name is required'
        if (!role) newErrors.role = 'Role is required'

        if (authMethod === 'traditional') {
            if (!password) {
                newErrors.password = 'Password is required'
            } else {
                if (password.length < 8) newErrors.password = 'Min 8 characters'
                else if (!/[A-Z]/.test(password)) newErrors.password = 'Needs uppercase letter'
                else if (!/[a-z]/.test(password)) newErrors.password = 'Needs lowercase letter'
                else if (!/\d/.test(password)) newErrors.password = 'Needs a number'
            }

            if (password && confirmPassword !== password) {
                newErrors.confirmPassword = 'Passwords do not match'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return

        setLoading(true)
        try {
            const payload: {
                email: string
                first_name: string
                last_name: string
                role: string
                auth_method: string
                password?: string
            } = {
                email,
                first_name: firstName,
                last_name: lastName,
                role,
                auth_method: authMethod,
            }

            if (authMethod === 'traditional') {
                payload.password = password
            }

            const result = await authAPI.adminCreateUser(payload)

            if (result.success) {
                toast.success(result.message || `User ${email} created successfully`)
                resetForm()
                setOpen(false)
                onUserCreated?.()
            } else {
                toast.error(result.message || 'Failed to create user')
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Create a new user account. The user will be auto-approved and active immediately.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Auth Method */}
                    <div className="space-y-2">
                        <Label>Authentication Method</Label>
                        <RadioGroup
                            value={authMethod}
                            onValueChange={(value) => {
                                setAuthMethod(value)
                                if (value === 'microsoft') {
                                    setPassword('')
                                    setConfirmPassword('')
                                    setErrors(prev => {
                                        const { password, confirmPassword, ...rest } = prev
                                        return rest
                                    })
                                }
                                // Reset search state on method change
                                setSearchResults([])
                                setShowDropdown(false)
                            }}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="traditional" id="traditional" />
                                <Label htmlFor="traditional" className="cursor-pointer font-normal">
                                    Traditional (Email & Password)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="microsoft" id="microsoft" />
                                <Label htmlFor="microsoft" className="cursor-pointer font-normal">
                                    Microsoft Entra ID
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Email with Search (for Microsoft) */}
                    <div className="space-y-1.5" ref={searchRef}>
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                value={authMethod === 'microsoft' ? searchQuery : email}
                                onChange={(e) => {
                                    if (authMethod === 'microsoft') {
                                        handleSearchInput(e.target.value)
                                    } else {
                                        setEmail(e.target.value)
                                    }
                                }}
                                placeholder={authMethod === 'microsoft'
                                    ? "Search org users by name or email..."
                                    : "john.doe@company.com"
                                }
                            />
                            {authMethod === 'microsoft' && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {searching ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                </div>
                            )}

                            {/* Search results dropdown */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                                    {searchResults.map((user, idx) => (
                                        <button
                                            key={user.microsoft_id || idx}
                                            type="button"
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors text-sm"
                                            onClick={() => selectOrgUser(user)}
                                        >
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">
                                                    {user.display_name || `${user.first_name} ${user.last_name}`}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No results message */}
                            {showDropdown && searchResults.length === 0 && !searching && searchQuery.length >= 2 && authMethod === 'microsoft' && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3">
                                    <p className="text-sm text-muted-foreground text-center">No users found. You can still type the email manually.</p>
                                </div>
                            )}
                        </div>
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    {/* Name fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                            />
                            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                            />
                            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                        </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r.id} value={r.name}>
                                        {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                                    </SelectItem>
                                ))}
                                {roles.length === 0 && (
                                    <>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                        {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                    </div>

                    {/* Password fields - only for traditional auth */}
                    {authMethod === 'traditional' && (
                        <>
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 8 chars, uppercase, lowercase, number"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                />
                                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                            </div>
                        </>
                    )}

                    {/* Microsoft info note */}
                    {authMethod === 'microsoft' && (
                        <div className="rounded-md bg-muted/50 border border-border p-3">
                            <p className="text-sm text-muted-foreground">
                                This user will be pre-approved. Their account will automatically link when they first sign in via Microsoft Entra ID.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => { resetForm(); setOpen(false) }} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
