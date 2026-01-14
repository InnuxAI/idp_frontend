"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
    IconCamera,
    IconLoader2,
    IconMail,
    IconUser,
    IconBriefcase,
    IconMapPin,
    IconWorld,
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

// Helper to get initials from name
function getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)
    const last = lastName?.charAt(0)
    return (first + last).toUpperCase()
}

// Helper to get display name from email
function getDisplayName(email: string): string {
    const namePart = email.split("@")[0]
    return namePart
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
}

export default function ProfilePage() {
    const { user } = useAuth()
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const email = user?.email || ""
    const [firstName, setFirstName] = useState(user?.first_name || "")
    const [lastName, setLastName] = useState(user?.last_name || "")
    const [jobTitle, setJobTitle] = useState("")
    const [location, setLocation] = useState("")
    const [bio, setBio] = useState("")
    const [website, setWebsite] = useState("")

    const initials = getInitials(user?.first_name || "", user?.last_name || "")
    const role = user?.role || "user"

    const handleSave = async () => {
        setIsSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsSaving(false)
        toast.success("Profile updated successfully")
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Profile</h1>
                <p className="text-base text-muted-foreground mt-2">
                    Manage your public profile and personal information.
                </p>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6">
                {/* Profile Photo Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Picture</CardTitle>
                        <CardDescription>
                            This will be displayed on your profile and in the team section.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-8">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                                <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-orange-400 to-pink-500 text-white">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-colors border-2 border-background">
                                <IconCamera size={16} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <div className="flex gap-3">
                                <Button variant="outline" size="sm">Change photo</Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">Remove</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                JPG, GIF or PNG. 1MB max.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your personal details here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <div className="relative">
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder={user?.first_name}
                                        className="pl-9"
                                    />
                                    <IconUser className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <div className="relative">
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder={user?.last_name}
                                        className="pl-9"
                                    />
                                    <IconUser className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    value={email}
                                    disabled
                                    className="pl-9 bg-muted/50"
                                />
                                <IconMail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Email address cannot be changed. Contact support for help.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="jobTitle">Job Title</Label>
                                <div className="relative">
                                    <Input
                                        id="jobTitle"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        placeholder="Software Engineer"
                                        className="pl-9"
                                    />
                                    <IconBriefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <div className="relative">
                                    <Input
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="San Francisco, CA"
                                        className="pl-9"
                                    />
                                    <IconMapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <div className="relative">
                                <Input
                                    id="website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://"
                                    className="pl-9"
                                />
                                <IconWorld className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself"
                                className="min-h-[100px] resize-none"
                            />
                            <p className="text-[0.8rem] text-muted-foreground text-right">
                                {bio.length}/200 characters
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-border/40 px-6 py-4 bg-muted/20">
                        <div className="text-xs text-muted-foreground">
                            Last saved: Never
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost">Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
