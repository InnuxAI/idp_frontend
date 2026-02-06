"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IconSun, IconMoon, IconDeviceDesktop, IconCheck, IconLayout, IconEye, IconBrush, IconLoader2 } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { usePreferences } from "@/contexts/preferences-context"
import { toast } from "sonner"

export default function AppearancePage() {
    const { theme, setTheme } = useTheme()
    const { sidebarPinned, setSidebarPinned } = usePreferences()
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [density, setDensity] = useState("default")

    const handleDensityChange = (val: string) => {
        setDensity(val)
        setHasChanges(true)
    }

    const handleThemeChange = (val: string) => {
        setTheme(val)
        // Theme change is immediate, but we can track it as a "change" if we want to sync it to backend later
    }

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setHasChanges(false)
            toast.success("Appearance settings saved")
        }, 800)
    }

    const handleCancel = () => {
        setHasChanges(false)
        setDensity("default")
        // revert logic...
    }

    const themes = [
        { id: "light", label: "Light", icon: IconSun, desc: "Clean and bright" },
        { id: "dark", label: "Dark", icon: IconMoon, desc: "Easy on the eyes" },
        { id: "system", label: "System", icon: IconDeviceDesktop, desc: "Matches device" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Appearance
                        </h1>
                        <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400">
                            Customizable
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Customize the visual theme and layout density.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="theme" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger
                        value="theme"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Theme & Colors
                    </TabsTrigger>
                    <TabsTrigger
                        value="interface"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Interface Density
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="theme" className="pt-6 space-y-6">
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">Color Mode</CardTitle>
                            <CardDescription>Select your preferred color scheme</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleThemeChange(t.id)}
                                        className={cn(
                                            "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                            theme === t.id
                                                ? "border-primary bg-primary/5"
                                                : "border-border/60 hover:border-border hover:bg-muted/20"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-3 rounded-full",
                                            theme === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        )}>
                                            <t.icon size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-foreground">{t.label}</p>
                                            <p className="text-xs text-muted-foreground">{t.desc}</p>
                                        </div>
                                        {theme === t.id && (
                                            <div className="absolute top-3 right-3 text-primary">
                                                <IconCheck size={18} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-medium">Accent Color</CardTitle>
                                <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="flex gap-4 pointer-events-none grayscale opacity-40">
                                {["#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#ec4899"].map((color) => (
                                    <div
                                        key={color}
                                        className="h-10 w-10 rounded-full border border-border shadow-sm"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="interface" className="pt-6 space-y-6">
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">Layout Density</CardTitle>
                            <CardDescription>Adjust the spacing of interface elements</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            <RadioGroup value={density} onValueChange={handleDensityChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start space-x-3 p-4 rounded-xl border border-border/60 hover:bg-muted/20 transition-colors">
                                    <RadioGroupItem value="default" id="density-default" className="mt-1" />
                                    <div className="space-y-1">
                                        <Label htmlFor="density-default" className="font-medium">Comfortable</Label>
                                        <p className="text-xs text-muted-foreground">Standard spacing with better readability.</p>
                                        <div className="mt-3 space-y-2 p-3 rounded bg-muted/30 border border-dashed border-border/50 scale-90 origin-top-left w-full">
                                            <div className="h-2 w-2/3 bg-muted-foreground/20 rounded"></div>
                                            <div className="h-2 w-1/2 bg-muted-foreground/20 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-4 rounded-xl border border-border/60 hover:bg-muted/20 transition-colors">
                                    <RadioGroupItem value="compact" id="density-compact" className="mt-1" />
                                    <div className="space-y-1">
                                        <Label htmlFor="density-compact" className="font-medium">Compact</Label>
                                        <p className="text-xs text-muted-foreground">Denser layout to show more data.</p>
                                        <div className="mt-3 space-y-1 p-3 rounded bg-muted/30 border border-dashed border-border/50 scale-90 origin-top-left w-full">
                                            <div className="h-1.5 w-2/3 bg-muted-foreground/20 rounded"></div>
                                            <div className="h-1.5 w-1/2 bg-muted-foreground/20 rounded"></div>
                                            <div className="h-1.5 w-3/4 bg-muted-foreground/20 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">Sidebar Behavior</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Pin Sidebar Open</Label>
                                    <p className="text-xs text-muted-foreground">Prevent auto-collapse on smaller screens</p>
                                </div>
                                <Checkbox
                                    checked={sidebarPinned}
                                    onCheckedChange={(checked) => setSidebarPinned(checked === true)}
                                />
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
