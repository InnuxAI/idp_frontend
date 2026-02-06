"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
    IconShield,
    IconKey,
    IconDeviceMobile,
    IconDeviceDesktop,
    IconHistory,
    IconDevices,
    IconLock,
    IconCheck,
    IconAlertTriangle,
    IconMapPin,
    IconClock,
    IconGlobe,
    IconLoader2
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function SecurityPage() {
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")

    const handlePasswordChange = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setHasChanges(false)
            setCurrentPassword("")
            setNewPassword("")
            toast.success("Password updated successfully")
        }, 1000)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Security & Access
                        </h1>
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                            <IconShield className="mr-1 h-3 w-3 fill-current" />
                            Secure
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Manage your password, two-factor authentication, and active sessions.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9">
                        <IconHistory className="mr-2 h-4 w-4" />
                        Security Log
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger
                        value="overview"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="sessions"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Active Sessions
                    </TabsTrigger>
                    <TabsTrigger
                        value="2fa"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Two-Factor Auth
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="pt-6 space-y-6">
                    {/* Password Change Card - ERPNext Style */}
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <IconKey className="h-4 w-4 text-muted-foreground" />
                                Change Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Password</Label>
                                        <Input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => {
                                                setCurrentPassword(e.target.value)
                                                setHasChanges(true)
                                            }}
                                            className="bg-muted/30 border-transparent hover:border-border focus:border-primary focus:bg-background transition-all"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Password</Label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value)
                                                setHasChanges(true)
                                            }}
                                            className="bg-muted/30 border-transparent hover:border-border focus:border-primary focus:bg-background transition-all"
                                            placeholder="••••••••••••"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Minimum 8 characters, with uppercase and special characters.
                                        </p>
                                    </div>
                                    {hasChanges && (
                                        <div className="pt-2">
                                            <Button size="sm" onClick={handlePasswordChange} disabled={!currentPassword || !newPassword || isSaving}>
                                                {isSaving && <IconLoader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                Update Password
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-muted/20 rounded-lg p-5 border border-dashed border-border flex flex-col justify-center gap-3">
                                    <h4 className="text-sm font-medium text-foreground">Password Requirements</h4>
                                    <ul className="space-y-2">
                                        {[
                                            { text: "At least 12 characters long", done: false },
                                            { text: "Contains at least one number", done: true },
                                            { text: "Contains at least one special character", done: true },
                                            { text: "Not used in the last 12 months", done: true },
                                        ].map((req, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full flex items-center justify-center border",
                                                    req.done
                                                        ? "bg-emerald-100 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800"
                                                        : "bg-muted border-border"
                                                )}>
                                                    <IconCheck size={10} className={cn(!req.done && "opacity-0")} />
                                                </div>
                                                <span className={cn(req.done && "text-foreground")}>{req.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Security Activity Log Preview */}
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0">
                            <CardTitle className="text-base font-medium">Recent Security Events</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="space-y-3">
                                {[
                                    { action: "Password changed", location: "San Francisco, US", ip: "192.168.1.1", time: "2 days ago", icon: IconKey, alert: false },
                                    { action: "New login detected", location: "San Francisco, US", ip: "192.168.1.1", time: "5 days ago", icon: IconDeviceDesktop, alert: false },
                                    { action: "Failed login attempt", location: "Moscow, RU", ip: "45.12.2.1", time: "1 week ago", icon: IconAlertTriangle, alert: true },
                                ].map((event, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-md bg-muted",
                                                event.alert && "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                            )}>
                                                <event.icon size={16} />
                                            </div>
                                            <div>
                                                <p className={cn("text-sm font-medium", event.alert && "text-red-600 dark:text-red-400")}>
                                                    {event.action}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{event.ip}</span>
                                                    <span>•</span>
                                                    <span>{event.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono">{event.time}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sessions" className="pt-6">
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-medium">Active Sessions</CardTitle>
                                <Button variant="destructive" size="sm" className="h-8">
                                    Revoke All Other Sessions
                                </Button>
                            </div>
                            <CardDescription>Devices where you are currently logged in</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 pt-2">
                            <div className="space-y-4">
                                {/* Current Session */}
                                <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-primary/10 bg-primary/5">
                                    <div className="p-3 rounded-lg bg-background border shadow-sm text-primary">
                                        <IconDeviceDesktop size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-foreground">MacBook Pro</h4>
                                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">Current Device</Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <IconMapPin size={14} />
                                                San Francisco, US
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <IconGlobe size={14} />
                                                Chrome 122.0
                                            </div>
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                                <IconClock size={14} />
                                                Active now
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Other Session */}
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:border-border transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                                            <IconDeviceMobile size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-foreground">iPhone 15 Pro</h4>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <IconMapPin size={12} /> San Francisco, US
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <IconClock size={12} /> Last active: 2 hours ago
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                        Revoke
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="2fa" className="pt-6">
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0">
                            <CardTitle className="text-base font-medium">Two-Factor Authentication (2FA)</CardTitle>
                            <CardDescription>Enhance your account security</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="rounded-xl border border-border/60 overflow-hidden">
                                <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-muted/20">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            <IconShield size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-foreground">Authenticator App</h3>
                                            <p className="text-sm text-muted-foreground max-w-md">
                                                Use an app like Google Authenticator or 1Password to generate time-based verification codes.
                                            </p>
                                        </div>
                                    </div>
                                    <Button>Enable 2FA</Button>
                                </div>
                                <div className="bg-background p-4 border-t border-border/60">
                                    <p className="text-xs text-muted-foreground text-center">
                                        We recommend enabling 2FA for all administrative accounts.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
