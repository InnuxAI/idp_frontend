"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
    IconLoader2,
    IconCheck,
    IconAlertTriangle,
    IconInfoCircle,
    IconCircleCheck,
    IconSettings,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { API_CONFIG } from "@/lib/config"
import Image from "next/image"

// Types
interface LLMProvider {
    id: string
    name: string
    model: string
    available: boolean
    is_current: boolean
}

interface LLMSettings {
    current_provider: string
    current_model: string
    providers: LLMProvider[]
}

// Provider metadata with official branding
const providerMeta: Record<string, {
    logo: string
    description: string
    features: string[]
    bgClass: string
    borderAccent: string
}> = {
    gemini: {
        logo: "/googlegemini.svg",
        description: "Google's most capable multimodal AI model with advanced reasoning, coding, and analysis capabilities.",
        features: ["Multimodal", "Long Context", "Code Generation"],
        bgClass: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
        borderAccent: "group-hover:border-blue-400 group-data-[selected=true]:border-blue-500",
    },
    openai: {
        logo: "/openai.svg",
        description: "Industry-standard AI with exceptional language understanding and broad enterprise adoption.",
        features: ["Enterprise Ready", "Function Calling", "Fine-tuning"],
        bgClass: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20",
        borderAccent: "group-hover:border-emerald-400 group-data-[selected=true]:border-emerald-500",
    },
    anthropic: {
        logo: "/anthropic.svg",
        description: "Safety-focused AI with excellent analytical reasoning and nuanced response generation.",
        features: ["Constitutional AI", "200K Context", "Artifacts"],
        bgClass: "from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20",
        borderAccent: "group-hover:border-orange-400 group-data-[selected=true]:border-orange-500",
    },
}

export default function AIModelsPage() {
    const [settings, setSettings] = useState<LLMSettings | null>(null)
    const [selectedProvider, setSelectedProvider] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const token = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token")
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/settings/llm`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) throw new Error("Failed to fetch settings")

            const data: LLMSettings = await response.json()
            setSettings(data)
            setSelectedProvider(data.current_provider)
        } catch (error) {
            console.error("Failed to load LLM settings:", error)
            toast.error("Failed to load AI model settings")
        } finally {
            setIsLoading(false)
        }
    }

    const handleProviderSelect = (providerId: string) => {
        setSelectedProvider(providerId)
        setHasChanges(providerId !== settings?.current_provider)
    }

    const handleSave = async () => {
        if (!hasChanges) return

        setIsSaving(true)
        try {
            const token = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token")
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/settings/llm`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ provider: selectedProvider }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || "Failed to update settings")
            }

            const data: LLMSettings = await response.json()
            setSettings(data)
            setHasChanges(false)
            toast.success(`Successfully switched to ${data.providers.find(p => p.is_current)?.name || selectedProvider}`)
        } catch (error) {
            console.error("Failed to update LLM settings:", error)
            toast.error(error instanceof Error ? error.message : "Failed to update AI model")
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setSelectedProvider(settings?.current_provider || "gemini")
        setHasChanges(false)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
                    <IconLoader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Loading AI configuration...</p>
            </div>
        )
    }

    const availableProviders = settings?.providers.filter(p => p.available) || []
    const unavailableProviders = settings?.providers.filter(p => !p.available) || []

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    AI Model Configuration
                </h1>
                <p className="text-sm text-muted-foreground">
                    Select the AI provider for document processing and intelligent chat. Changes apply globally.
                </p>
            </div>

            <Separator />

            {/* Main Content */}
            <div className="space-y-6">
                {/* Current Status Banner */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border">
                    <IconSettings className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                            <span className="text-muted-foreground">Active Provider:</span>{" "}
                            <span className="font-medium">{settings?.providers.find(p => p.is_current)?.name}</span>
                            <span className="text-muted-foreground mx-2">•</span>
                            <span className="font-mono text-xs text-muted-foreground">{settings?.current_model}</span>
                        </p>
                    </div>
                    {hasChanges && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs font-medium">Unsaved</span>
                        </motion.div>
                    )}
                </div>

                {/* Available Providers Section */}
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <IconCircleCheck className="h-4 w-4 text-emerald-500" />
                        Available Providers
                    </h2>
                    <div className="grid gap-3">
                        {availableProviders.map((provider, index) => {
                            const meta = providerMeta[provider.id]
                            const isSelected = selectedProvider === provider.id

                            return (
                                <motion.button
                                    key={provider.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleProviderSelect(provider.id)}
                                    data-selected={isSelected}
                                    className={cn(
                                        "group relative w-full text-left transition-all duration-200",
                                        "rounded-xl border-2 overflow-hidden",
                                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                        isSelected
                                            ? "border-primary shadow-lg shadow-primary/10"
                                            : "border-border hover:shadow-md",
                                        meta?.borderAccent
                                    )}
                                >
                                    {/* Background gradient */}
                                    <div className={cn(
                                        "absolute inset-0 opacity-0 transition-opacity duration-300",
                                        "group-hover:opacity-100 group-data-[selected=true]:opacity-100",
                                        `bg-gradient-to-br ${meta?.bgClass}`
                                    )} />

                                    <div className="relative flex items-start gap-4 p-5">
                                        {/* Provider Logo */}
                                        <div className={cn(
                                            "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center",
                                            "bg-white dark:bg-zinc-900 border border-border/50 shadow-sm",
                                            "transition-transform duration-200 group-hover:scale-105"
                                        )}>
                                            <Image
                                                src={meta?.logo || "/file.svg"}
                                                alt={`${provider.name} logo`}
                                                width={32}
                                                height={32}
                                                className="object-contain dark:invert"
                                            />
                                        </div>

                                        {/* Provider Details */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-foreground">
                                                    {provider.name}
                                                </h3>
                                                {provider.is_current && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                        <IconCheck className="h-3 w-3" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {meta?.description}
                                            </p>

                                            {/* Feature tags */}
                                            <div className="flex items-center gap-2 flex-wrap pt-1">
                                                {meta?.features.map((feature) => (
                                                    <span
                                                        key={feature}
                                                        className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground"
                                                    >
                                                        {feature}
                                                    </span>
                                                ))}
                                                <span className="px-2 py-0.5 rounded text-xs font-mono bg-muted/50 text-muted-foreground">
                                                    {provider.model}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Selection Radio */}
                                        <div className={cn(
                                            "flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200",
                                            "flex items-center justify-center",
                                            isSelected
                                                ? "border-primary bg-primary"
                                                : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                                        )}>
                                            <AnimatePresence>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <IconCheck className="h-3.5 w-3.5 text-primary-foreground" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>
                </div>

                {/* Unavailable Providers Section */}
                {unavailableProviders.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <IconAlertTriangle className="h-4 w-4 text-amber-500" />
                            Requires Configuration
                        </h2>
                        <div className="grid gap-3">
                            {unavailableProviders.map((provider, index) => {
                                const meta = providerMeta[provider.id]

                                return (
                                    <div
                                        key={provider.id}
                                        className="relative w-full rounded-xl border border-dashed border-border/60 bg-muted/20 overflow-hidden opacity-60"
                                    >
                                        <div className="flex items-center gap-4 p-4">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-muted border border-border/50">
                                                <Image
                                                    src={meta?.logo || "/file.svg"}
                                                    alt={`${provider.name} logo`}
                                                    width={24}
                                                    height={24}
                                                    className="object-contain grayscale dark:invert"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-muted-foreground">
                                                        {provider.name}
                                                    </h3>
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500">
                                                        API Key Required
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground/70 mt-0.5">
                                                    Contact your administrator to configure this provider
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Info Notice */}
                <div className="flex gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
                    <IconInfoCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-medium">Configuration applies globally</p>
                        <p className="text-blue-700/80 dark:text-blue-400/80 mt-0.5">
                            Changing the AI provider will affect all document analysis and chat functionality across the platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <AnimatePresence>
                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="sticky bottom-0 -mx-6 px-6 py-4 bg-background/95 backdrop-blur-sm border-t border-border"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                You have unsaved changes
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                >
                                    Discard
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="min-w-[120px]"
                                >
                                    {isSaving ? (
                                        <>
                                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
