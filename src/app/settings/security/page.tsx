"use client"

import { motion } from "framer-motion"
import { IconShield, IconKey, IconDeviceMobile, IconHistory, IconDevices, IconLock } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Security</h1>
                <p className="text-base text-muted-foreground mt-2">
                    Manage your account security and authentication methods.
                </p>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6">
                {/* Password Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <IconKey className="h-5 w-5 text-primary" />
                                    Password
                                </CardTitle>
                                <CardDescription>
                                    Manage your password and recovery settings.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-full bg-background border border-border">
                                    <IconLock className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Password</p>
                                    <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">Change</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Two-Factor Auth */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconShield className="h-5 w-5 text-primary" />
                            Two-Factor Authentication
                        </CardTitle>
                        <CardDescription>
                            Add an extra layer of security to your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-medium text-sm">Authenticator App</p>
                                <p className="text-xs text-muted-foreground max-w-[300px]">
                                    Use an authenticator app like Google Authenticator or Authy to generate verification codes.
                                </p>
                            </div>
                            {/* Toggle simulation using Button for now as we lack Switch */}
                            <Button variant="default" size="sm">Enable</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconDevices className="h-5 w-5 text-primary" />
                            Active Sessions
                        </CardTitle>
                        <CardDescription>
                            Manage devices where you're currently logged in.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                                    <IconDeviceMobile size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">Chrome on macOS</p>
                                        <Badge variant="secondary" className="text-[10px] h-5">Current</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        San Francisco, CA • Active now
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 opacity-60">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
                                    <IconDeviceMobile size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Safari on iPhone</p>
                                    <p className="text-xs text-muted-foreground">
                                        San Francisco, CA • 2 hours ago
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8">Revoke</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
