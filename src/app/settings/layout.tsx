"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    IconUser,
    IconBell,
    IconShield,
    IconPalette,
    IconKey,
    IconBrain,
    IconChevronRight,
} from "@tabler/icons-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const settingsNavItems = [
    {
        title: "Profile",
        href: "/settings/profile",
        icon: IconUser,
        description: "Personal info",
    },
    {
        title: "Security",
        href: "/settings/security",
        icon: IconShield,
        description: "Password & 2FA",
    },
    {
        title: "Notifications",
        href: "/settings/notifications",
        icon: IconBell,
        description: "Email & push",
    },
    {
        title: "Appearance",
        href: "/settings/appearance",
        icon: IconPalette,
        description: "Theme preferences",
    },
    {
        title: "API Keys",
        href: "/settings/api-keys",
        icon: IconKey,
        description: "Developer access",
    },
    {
        title: "AI Models",
        href: "/settings/ai-models",
        icon: IconBrain,
        description: "LLM provider",
    },
]

export default function SettingsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname()

    // Get current page title for breadcrumb
    const currentPage = settingsNavItems.find(item => pathname === item.href)?.title || "Profile"

    return (
        <SidebarProvider
            defaultOpen={false}
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50">
                <SiteHeader
                    breadcrumb={
                        <Breadcrumb>
                            <BreadcrumbList>
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                                            Platform
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                                    <BreadcrumbSeparator className="hidden md:block text-muted-foreground/40" />
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                                            Settings
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                                    <BreadcrumbSeparator className="text-muted-foreground/40" />
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="font-medium text-foreground">{currentPage}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </motion.div>
                            </BreadcrumbList>
                        </Breadcrumb>
                    }
                />
                <div className="flex flex-1 flex-col lg:flex-row h-full">
                    {/* Settings Navigation Sidebar */}
                    <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-border/40 bg-background/50 backdrop-blur-sm p-4 lg:p-6 lg:py-8">
                        <div className="mb-6 px-2">
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">Settings</h2>
                            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
                        </div>
                        <nav className="space-y-1">
                            {settingsNavItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="settings-active"
                                                className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <div className="flex items-center gap-3 relative z-10">
                                            <item.icon size={18} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                            <span>{item.title}</span>
                                        </div>
                                        {isActive && (
                                            <IconChevronRight size={14} className="text-primary/60 relative z-10" />
                                        )}
                                    </Link>
                                )
                            })}
                        </nav>
                        <Separator className="my-6 opacity-50" />
                        <div className="px-4">
                            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-4 border border-orange-100 dark:border-orange-900/50">
                                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">Need help?</h3>
                                <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mb-3">
                                    Check our documentation or contact support.
                                </p>
                                <button className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline">
                                    Contact Support &rarr;
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Settings Content */}
                    <main className="flex-1 p-6 lg:p-10 lg:pl-12 min-h-[calc(100vh-var(--header-height))] bg-zinc-50/50 dark:bg-zinc-950/50">
                        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
