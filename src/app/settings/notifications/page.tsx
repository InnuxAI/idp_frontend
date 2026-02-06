"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
    IconMail,
    IconBell,
    IconDeviceMobile,
    IconCheck,
    IconMessage,
    IconBuilding,
    IconLoader2
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

export default function NotificationsPage() {
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Preference State
    const [preferences, setPreferences] = useState({
        marketing: false,
        security: true,
        updates: true,
        comments: true,
        mentions: true,
        invites: true
    })

    const handleToggle = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
        setHasChanges(true)
    }

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setHasChanges(false)
            toast.success("Notification preferences saved")
        }, 800)
    }

    const handleCancel = () => {
        setHasChanges(false)
        // In real app, revert state here
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Notifications
                        </h1>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-transparent">
                            3 Channels Active
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Configure how and when you receive alerts.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="channels" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger
                        value="channels"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Channels
                    </TabsTrigger>
                    <TabsTrigger
                        value="preferences"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Alert Preferences
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="channels" className="pt-6 space-y-6">
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">Delivery Channels</CardTitle>
                            <CardDescription>Where should we send your notifications?</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 grid gap-4">
                            {[
                                {
                                    icon: IconMail,
                                    title: "Email Notifications",
                                    desc: "Send to user@example.com",
                                    checked: true,
                                    color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                },
                                {
                                    icon: IconDeviceMobile,
                                    title: "Push Notifications",
                                    desc: "Send to your mobile devices and browser",
                                    checked: true,
                                    color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                },
                                {
                                    icon: IconMessage,
                                    title: "Slack Integration",
                                    desc: "Send to connected Slack workspace",
                                    checked: false,
                                    color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                },
                            ].map((channel, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:border-border transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2.5 rounded-lg", channel.color)}>
                                            <channel.icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-foreground">{channel.title}</h4>
                                            <p className="text-xs text-muted-foreground">{channel.desc}</p>
                                        </div>
                                    </div>
                                    <Switch checked={channel.checked} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences" className="pt-6 space-y-6">
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">System Alerts</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-medium">Security Alerts</h4>
                                    <p className="text-xs text-muted-foreground">Critical security updates and login detections</p>
                                </div>
                                <Switch checked={preferences.security} onCheckedChange={() => handleToggle('security')} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-medium">Product Updates</h4>
                                    <p className="text-xs text-muted-foreground">New features and system improvements</p>
                                </div>
                                <Switch checked={preferences.updates} onCheckedChange={() => handleToggle('updates')} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">Team Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-medium">Comments & Mentions</h4>
                                    <p className="text-xs text-muted-foreground">When someone mentions you or comments on your docs</p>
                                </div>
                                <Switch checked={preferences.comments} onCheckedChange={() => handleToggle('comments')} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-medium">Team Invites</h4>
                                    <p className="text-xs text-muted-foreground">When you get invited to a new workspace</p>
                                </div>
                                <Switch checked={preferences.invites} onCheckedChange={() => handleToggle('invites')} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">Marketing</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-medium">Promotional Emails</h4>
                                    <p className="text-xs text-muted-foreground">Tips, offers, and partner news</p>
                                </div>
                                <Switch checked={preferences.marketing} onCheckedChange={() => handleToggle('marketing')} />
                            </div>
                        </CardContent>
                    </Card>
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
