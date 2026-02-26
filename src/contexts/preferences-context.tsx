"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface PreferencesContextType {
    sidebarPinned: boolean
    setSidebarPinned: (pinned: boolean) => void
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    // Start with true (consistent for SSR and client initial render)
    const [sidebarPinned, setSidebarPinnedState] = useState(true)
    const [isHydrated, setIsHydrated] = useState(false)

    // Load from localStorage AFTER hydration to avoid mismatch
    useEffect(() => {
        const stored = localStorage.getItem("sidebar-pinned")
        if (stored === "false") {
            setSidebarPinnedState(false)
        } else if (stored === null) {
            // Default to true if not set
            localStorage.setItem("sidebar-pinned", "true")
            setSidebarPinnedState(true)
        }
        setIsHydrated(true)
    }, [])

    // Wrapper to also persist to localStorage when setting
    const setSidebarPinned = (pinned: boolean) => {
        setSidebarPinnedState(pinned)
        localStorage.setItem("sidebar-pinned", String(pinned))
    }

    return (
        <PreferencesContext.Provider value={{ sidebarPinned, setSidebarPinned }}>
            {children}
        </PreferencesContext.Provider>
    )
}

export function usePreferences() {
    const context = useContext(PreferencesContext)
    if (context === undefined) {
        throw new Error("usePreferences must be used within a PreferencesProvider")
    }
    return context
}
