"use client"

import { motion } from "framer-motion"
import { IconSun, IconMoon, IconDeviceDesktop, IconCheck } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { usePreferences } from "@/contexts/preferences-context"

export default function AppearancePage() {
    const { theme, setTheme } = useTheme()
    const { sidebarPinned, setSidebarPinned } = usePreferences()

    const themes = [
        { id: "light", label: "Light", icon: IconSun },
        { id: "dark", label: "Dark", icon: IconMoon },
        { id: "system", label: "System", icon: IconDeviceDesktop },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Appearance</h1>
                <p className="text-base text-muted-foreground mt-2">
                    Customize the look and feel of the platform.
                </p>
            </div>

            <Separator className="my-6" />

            {/* Theme Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Theme Preferences</CardTitle>
                    <CardDescription>
                        Select the color theme for the interface.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-2">
                        {themes.map((t) => (
                            <div key={t.id} className="space-y-2">
                                <button
                                    onClick={() => setTheme(t.id)}
                                    className={cn(
                                        "w-full aspect-[4/3] rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        theme === t.id
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "border-muted bg-muted/20 hover:border-muted-foreground/50"
                                    )}
                                >
                                    <t.icon
                                        size={32}
                                        stroke={1.5}
                                        className={cn(
                                            theme === t.id ? "text-primary" : "text-muted-foreground"
                                        )}
                                    />
                                    {theme === t.id && (
                                        <div className="absolute top-2 right-2">
                                            <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                <IconCheck size={12} stroke={3} />
                                            </div>
                                        </div>
                                    )}
                                </button>
                                <p className="text-sm font-medium text-center">{t.label}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Sidebar Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Sidebar Preferences</CardTitle>
                    <CardDescription>
                        Customize how the sidebar behaves.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="sidebar-pin"
                            checked={sidebarPinned}
                            onCheckedChange={(checked) => setSidebarPinned(checked === true)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="sidebar-pin"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Pin Sidebar Open
                            </label>
                            <p className="text-sm text-muted-foreground">
                                Disable auto-collapse based on mouse events.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Accent Color Preview */}
            <Card className="opacity-80">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Accent Color</CardTitle>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Coming Soon</span>
                    </div>
                    <CardDescription>
                        Future updates will allow custom accent colors.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 pointer-events-none grayscale opacity-50">
                        {["#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#ec4899"].map((color) => (
                            <div
                                key={color}
                                className="h-8 w-8 rounded-full border border-border shadow-sm ring-offset-background"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
