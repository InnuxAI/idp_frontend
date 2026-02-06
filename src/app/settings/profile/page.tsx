"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
    IconCamera,
    IconLoader2,
    IconMail,
    IconUser,
    IconBriefcase,
    IconMapPin,
    IconWorld,
    IconHistory,
    IconDeviceDesktop,
    IconClock,
    IconCheck,
} from "@tabler/icons-react"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Helper to get initials from name
function getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)
    const last = lastName?.charAt(0)
    return (first + last).toUpperCase()
}

export default function ProfilePage() {
    const { user } = useAuth()
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Form state
    const [firstName, setFirstName] = useState(user?.first_name || "")
    const [lastName, setLastName] = useState(user?.last_name || "")
    const [jobTitle, setJobTitle] = useState("Senior Developer")
    const [location, setLocation] = useState("San Francisco, CA")
    const [bio, setBio] = useState("Building the future of IDP.")
    const [website, setWebsite] = useState("https://innux.ai")

    const initials = getInitials(user?.first_name || "A", user?.last_name || "U")

    const handleInputChange = (setter: (value: string) => void, value: string) => {
        setter(value)
        setHasChanges(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        setIsSaving(false)
        setHasChanges(false)
        toast.success("Profile updated successfully")
    }

    const handleCancel = () => {
        setHasChanges(false)
    }

    return (
        <div className="space-y-6">
            {/* Header Section - ERPNext Style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {user?.first_name || "Azure"} {user?.last_name || "User"}
                        </h1>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent">
                            Active
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Manage your personal information and account preferences.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9">
                        <IconHistory className="mr-2 h-4 w-4" />
                        View Logs
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger
                        value="details"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Details
                    </TabsTrigger>
                    <TabsTrigger
                        value="activity"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Activity
                    </TabsTrigger>
                    <TabsTrigger
                        value="connections"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Connections
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="pt-6 space-y-6">
                    {/* Primary Info Card - Cleaner Layout */}
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Initial/Photo Column */}
                                <div className="flex flex-col items-center gap-3 max-w-[200px]">
                                    <div className="relative group">
                                        <Avatar className="h-28 w-28 border-2 border-border/50 shadow-sm">
                                            <AvatarFallback className="text-3xl font-medium bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-300">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <button className="absolute bottom-0 right-0 p-2 rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-colors text-muted-foreground">
                                            <IconCamera size={16} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground">
                                        Allowed: JPG, PNG<br />Max: 1MB
                                    </p>
                                </div>

                                {/* Form Fields - ERPNext Key/Value Style Grid */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">First Name</Label>
                                        <Input
                                            value={firstName}
                                            onChange={(e) => handleInputChange(setFirstName, e.target.value)}
                                            className="bg-muted/30 border-transparent hover:border-border focus:border-primary focus:bg-background transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Name</Label>
                                        <Input
                                            value={lastName}
                                            onChange={(e) => handleInputChange(setLastName, e.target.value)}
                                            className="bg-muted/30 border-transparent hover:border-border focus:border-primary focus:bg-background transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                                        <Input
                                            value={user?.email || ""}
                                            disabled
                                            className="bg-muted/30 border-transparent text-muted-foreground/80 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</Label>
                                        <div className="flex items-center h-10 px-3 rounded-md bg-muted/30 border border-transparent">
                                            <span className="text-sm font-medium capitalize">{user?.role || "user"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Extended Info */}
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">Professional Details</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job Title</Label>
                                    <div className="relative">
                                        <Input
                                            value={jobTitle}
                                            onChange={(e) => handleInputChange(setJobTitle, e.target.value)}
                                            className="bg-muted/30 border-transparent hover:border-border focus:border-primary focus:bg-background pl-9 transition-all"
                                        />
                                        <IconBriefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</Label>
                                    <div className="relative">
                                        <Input
                                            value={location}
                                            onChange={(e) => handleInputChange(setLocation, e.target.value)}
                                            className="bg-muted/30 border-transparent hover:border-border focus:border-primary focus:bg-background pl-9 transition-all"
                                        />
                                        <IconMapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bio</Label>
                                    <Textarea
                                        value={bio}
                                        onChange={(e) => handleInputChange(setBio, e.target.value)}
                                        className="bg-muted/30 border-transparent hover:border-border focus:border-primary focus:bg-background min-h-[80px] resize-none transition-all"
                                    />
                                    <p className="text-[10px] text-muted-foreground text-right mt-1">
                                        Brief description for your team profile
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="pt-6">
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0">
                            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
                            <CardDescription>Timeline of changes and logins</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="relative pl-4 border-l border-border/60 space-y-8 my-2">
                                {[
                                    { text: "Updated profile information", time: "Just now", icon: IconUser, color: "text-blue-500" },
                                    { text: "Logged in from New Device (MacBook Pro)", time: "2 hours ago", icon: IconDeviceDesktop, color: "text-emerald-500" },
                                    { text: "Changed password", time: "Yesterday", icon: IconCheck, color: "text-orange-500" },
                                    { text: "API Key 'Dev-Test' created", time: "3 days ago", icon: IconHistory, color: "text-purple-500" },
                                ].map((item, i) => (
                                    <div key={i} className="relative flex gap-4 items-start group">
                                        <div className={cn(
                                            "absolute -left-[21px] p-1 rounded-full bg-background border border-border group-hover:border-primary/50 transition-colors",
                                            item.color
                                        )}>
                                            <item.icon size={12} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-foreground">{item.text}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <IconClock size={12} />
                                                <span>{item.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="connections" className="pt-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed">
                        <div className="p-3 rounded-full bg-muted mb-3">
                            <IconWorld className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground">No Connected Accounts</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                            Connect your GitHub or Google account to enable single sign-on and other integrations.
                        </p>
                        <Button variant="outline" size="sm" className="mt-4">
                            Connect Account
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Sticky Action Footer */}
            <AnimatePresence>
                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="sticky bottom-4 z-50 mx-auto max-w-2xl px-6 py-3 bg-foreground/95 backdrop-blur-sm text-background rounded-full shadow-lg flex items-center justify-between"
                    >
                        <span className="text-sm font-medium pl-2">Unsaved changes</span>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="h-8 text-background hover:text-background hover:bg-white/10"
                            >
                                Discard
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-8 bg-background text-foreground hover:bg-background/90"
                            >
                                {isSaving ? (
                                    <IconLoader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <IconCheck className="mr-2 h-3.5 w-3.5" />
                                )}
                                Save
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
