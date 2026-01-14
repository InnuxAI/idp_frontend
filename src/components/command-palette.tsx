"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  IconDashboard,
  IconDatabase,
  IconMessageCircle,
  IconFileText,
  IconUpload,
  IconSearch,
  IconSettings,
  IconHelp,
  IconChartBar,
  IconListDetails,
  IconFolder,
  IconUsers,
  IconReport,
  IconFileWord,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconFileAi,
  IconArrowsLeftRight,
  IconLogout,
  IconShield,
  IconUserCog,
  IconSchema,
} from "@tabler/icons-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useDocumentContext } from "@/contexts/document-context"
import { useAuth } from "@/contexts/AuthContext"
import { documentCategories } from "@/lib/document-categories"
import { PAGE_PERMISSIONS } from "@/lib/page-permissions"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { setUploadModalOpen, setDocsModalOpen } = useDocumentContext()
  const { logout, user } = useAuth()

  // Get user permissions
  const userPermissions = user?.permissions || []

  // Helper to check if user has required permission
  const hasPermission = (requiredPermission?: string) => {
    if (!requiredPermission) return true // No permission required
    return userPermissions.includes(requiredPermission)
  }

  const runCommand = React.useCallback((command: () => void) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {hasPermission(PAGE_PERMISSIONS.DASHBOARD) && (
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
              <IconDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
          )}
          {hasPermission(PAGE_PERMISSIONS.KNOWLEDGE_GRAPH) && (
            <CommandItem
              onSelect={() => runCommand(() => router.push("/zete"))}
            >
              <IconSchema className="mr-2 h-4 w-4" />
              <span>Knowledge Graph</span>
            </CommandItem>
          )}
          {hasPermission(PAGE_PERMISSIONS.FIELD_EXTRACTION) && (
            <CommandItem
              onSelect={() => runCommand(() => router.push("/field-extraction"))}
            >
              <IconFileAi className="mr-2 h-4 w-4" />
              <span>Field Extraction</span>
            </CommandItem>
          )}
          <CommandItem
            onSelect={() => runCommand(() => router.push("/chat"))}
          >
            <IconMessageCircle className="mr-2 h-4 w-4" />
            <span>Chat with Documents</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Library">
          {hasPermission(PAGE_PERMISSIONS.DATA_LIBRARY) && (
            <CommandItem
              onSelect={() => runCommand(() => router.push("/data-library"))}
            >
              <IconDatabase className="mr-2 h-4 w-4" />
              <span>Data Library</span>
            </CommandItem>
          )}
          {hasPermission(PAGE_PERMISSIONS.SCHEMA_LIBRARY) && (
            <CommandItem
              onSelect={() => runCommand(() => router.push("/extraction-schemas"))}
            >
              <IconDatabase className="mr-2 h-4 w-4" />
              <span>Schema Library</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => setUploadModalOpen(true))}
          >
            <IconUpload className="mr-2 h-4 w-4" />
            <span>Upload Document</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setDocsModalOpen(true))}
          >
            <IconFileText className="mr-2 h-4 w-4" />
            <span>Select Documents</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Analytics">
          {hasPermission(PAGE_PERMISSIONS.ANALYTICS) && (
            <CommandItem
              onSelect={() => runCommand(() => router.push("/2_way_match"))}
            >
              <IconArrowsLeftRight className="mr-2 h-4 w-4" />
              <span>Two-Way Match</span>
            </CommandItem>
          )}
          <CommandItem
            onSelect={() => runCommand(() => router.push("#lifecycle"))}
          >
            <IconListDetails className="mr-2 h-4 w-4" />
            <span>Lifecycle</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {hasPermission(PAGE_PERMISSIONS.DATA_LIBRARY) && (
          <>
            <CommandGroup heading="Document Categories">
              {documentCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  onSelect={() => runCommand(() => router.push(`/data-library?category=${category.id}`))}
                >
                  <div
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Organization">
          <CommandItem
            onSelect={() => runCommand(() => router.push("#projects"))}
          >
            <IconFolder className="mr-2 h-4 w-4" />
            <span>Projects</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("#team"))}
          >
            <IconUsers className="mr-2 h-4 w-4" />
            <span>Team</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Admin Section - Only show if user has admin permissions */}
        {(hasPermission(PAGE_PERMISSIONS.ADMIN) || hasPermission(PAGE_PERMISSIONS.ROLE_MANAGEMENT)) && (
          <>
            <CommandGroup heading="Admin">
              {hasPermission(PAGE_PERMISSIONS.ADMIN) && (
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/admin"))}
                >
                  <IconShield className="mr-2 h-4 w-4" />
                  <span>User Management</span>
                </CommandItem>
              )}
              {hasPermission(PAGE_PERMISSIONS.ROLE_MANAGEMENT) && (
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/admin/roles"))}
                >
                  <IconUserCog className="mr-2 h-4 w-4" />
                  <span>Role Management</span>
                </CommandItem>
              )}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Preferences">
          <CommandItem
            onSelect={() => runCommand(() => setTheme("light"))}
          >
            <IconSun className="mr-2 h-4 w-4" />
            <span>Light Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme("dark"))}
          >
            <IconMoon className="mr-2 h-4 w-4" />
            <span>Dark Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme("system"))}
          >
            <IconDeviceDesktop className="mr-2 h-4 w-4" />
            <span>System Theme</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Support">
          {hasPermission(PAGE_PERMISSIONS.SETTINGS) && (
            <CommandItem
              onSelect={() => runCommand(() => router.push("/settings"))}
            >
              <IconSettings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          )}
          <CommandItem
            onSelect={() => runCommand(() => router.push("#help"))}
          >
            <IconHelp className="mr-2 h-4 w-4" />
            <span>Get Help</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem
            onSelect={() => runCommand(async () => {
              await logout()
              router.push("/login")
            })}
            className="text-red-500 aria-selected:text-red-500 aria-selected:bg-red-50 dark:aria-selected:bg-red-950/30"
          >
            <IconLogout className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
