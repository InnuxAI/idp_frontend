"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { IconMail, IconBell, IconDeviceMobile, IconCheck, IconMessage, IconBuilding } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface SwitchProps {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    label?: string
    description?: string
}

function SwitchItem({ checked, onCheckedChange, label, description }: SwitchProps) {
    return (
        <div className="flex items-center justify-between space-x-4 py-3">
            <div className="space-y-0.5">
                {label && <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</p>}
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={cn(
                    "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                    checked ? "bg-primary" : "bg-input"
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                        checked ? "translate-x-4" : "translate-x-0"
                    )}
                />
            </button>
        </div>
    )
}

export default function NotificationsPage() {
    const [emailNotifs, setEmailNotifs] = useState(true)
    const [marketingEmails, setMarketingEmails] = useState(false)
    const [pushNotifs, setPushNotifs] = useState(false)
    const [securityAlerts, setSecurityAlerts] = useState(true)
    const [teamActivity, setTeamActivity] = useState(true)

    const handleSave = () => {
        toast.success("Notification preferences saved")
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Notifications</h1>
                <p className="text-base text-muted-foreground mt-2">
                    Configure how you receive alerts and updates.
                </p>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6">
                {/* Email Notifications */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <IconMail className="h-5 w-5 text-primary" />
                            <CardTitle>Email Settings</CardTitle>
                        </div>
                        <CardDescription>
                            Manage the emails you receive from us.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-1">
                        <SwitchItem
                            label="Communication Emails"
                            description="Receive emails about your account activity."
                            checked={emailNotifs}
                            onCheckedChange={setEmailNotifs}
                        />
                        <Separator className="my-2" />
                        <SwitchItem
                            label="Marketing Emails"
                            description="Receive emails about new products, features, and more."
                            checked={marketingEmails}
                            onCheckedChange={setMarketingEmails}
                        />
                        <Separator className="my-2" />
                        <SwitchItem
                            label="Security Emails"
                            description="Receive emails about your account security."
                            checked={securityAlerts}
                            onCheckedChange={setSecurityAlerts}
                        />
                    </CardContent>
                </Card>

                {/* Activity */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <IconBell className="h-5 w-5 text-primary" />
                            <CardTitle>Activity Alerts</CardTitle>
                        </div>
                        <CardDescription>
                            Choose what activity you want to be notified about.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-1">
                        <SwitchItem
                            label="Push Notifications"
                            description="Receive push notifications in your browser."
                            checked={pushNotifs}
                            onCheckedChange={setPushNotifs}
                        />
                        <Separator className="my-2" />
                        <SwitchItem
                            label="Team Activity"
                            description="Notified when team members modify shared resources."
                            checked={teamActivity}
                            onCheckedChange={setTeamActivity}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} size="lg">Save Preferences</Button>
                </div>
            </div>
        </div>
    )
}
