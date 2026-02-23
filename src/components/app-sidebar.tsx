"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  // IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  // IconFileDescription,
  IconFileInvoice,
  // IconFileWord,
  // IconFolder,
  IconHelp,
  IconSchema,
  IconLeaf,
  // IconListDetails,
  // IconReport,
  IconSearch,
  IconSettings,
  IconShield,
  // IconUsers,
  IconUserCog,
  IconMessageChatbot,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/contexts/AuthContext"
import { PAGE_PERMISSIONS } from "@/lib/page-permissions"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { usePreferences } from "@/contexts/preferences-context"

// Navigation items with required permissions
const navMainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
    tooltip: "Overview of all metrics",
    requiredPermission: PAGE_PERMISSIONS.DASHBOARD,
  },
  {
    title: "Knowledge Graph",
    url: "/zete",
    icon: IconSchema,
    tooltip: "Visualize relationships",
    requiredPermission: PAGE_PERMISSIONS.KNOWLEDGE_GRAPH,
  },
  // {
  //   title: "RAG Chat",
  //   url: "/rag-chat",
  //   icon: IconMessageChatbot,
  //   tooltip: "Chat with your documents using AI",
  //   requiredPermission: PAGE_PERMISSIONS.KNOWLEDGE_GRAPH,
  // },
  {
    title: "Agro Chat",
    url: "/agro-chat",
    icon: IconMessageChatbot,
    tooltip: "Chat with agricultural documents using AI",
    requiredPermission: PAGE_PERMISSIONS.KNOWLEDGE_GRAPH,
  },
  {
    title: "Field Extraction",
    url: "/field-extraction",
    icon: IconFileAi,
    tooltip: "Extract data from documents",
    requiredPermission: PAGE_PERMISSIONS.FIELD_EXTRACTION,
  },
  {
    title: "Analytics",
    url: "/2_way_match",
    icon: IconChartBar,
    tooltip: "Two Way matching",
    requiredPermission: PAGE_PERMISSIONS.ANALYTICS,
  },
  {
    title: "Invoice Approval",
    url: "/hitl",
    icon: IconFileInvoice,
    tooltip: "AI-powered invoice approval",
    requiredPermission: PAGE_PERMISSIONS.HITL,
  }
]

const documentItems = [
  // {
  //   name: "Legacy Library",
  //   url: "/data-library",
  //   icon: IconDatabase,
  //   tooltip: "Manage uploaded documents",
  //   requiredPermission: PAGE_PERMISSIONS.DATA_LIBRARY,
  // },
  // {
  //   name: "Data Library",
  //   url: "/zete-library",
  //   icon: IconFolder,
  //   tooltip: "Browse Zete documents",
  //   requiredPermission: PAGE_PERMISSIONS.DATA_LIBRARY,
  // },
  {
    name: "Schema Library",
    url: "/extraction-schemas",
    icon: IconDatabase,
    tooltip: "Manage extraction schemas",
    requiredPermission: PAGE_PERMISSIONS.SCHEMA_LIBRARY,
  },
  {
    name: "Agro Library",
    url: "/agro-library",
    icon: IconLeaf,
    tooltip: "Browse Agro Chat documents",
    requiredPermission: PAGE_PERMISSIONS.DATA_LIBRARY,
  },
]

const adminItems = [
  {
    name: "User Management",
    url: "/admin",
    icon: IconShield,
    tooltip: "Manage users",
    requiredPermission: PAGE_PERMISSIONS.ADMIN,
  },
  {
    name: "Role Management",
    url: "/admin/roles",
    icon: IconUserCog,
    tooltip: "Manage roles and permissions",
    requiredPermission: PAGE_PERMISSIONS.ROLE_MANAGEMENT,
  },
]

const navSecondaryItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
    requiredPermission: PAGE_PERMISSIONS.SETTINGS,
  },
  {
    title: "Get Help",
    url: "#",
    icon: IconHelp,
  },
  {
    title: "Search",
    url: "#",
    icon: IconSearch,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, checkPermission, isLoading } = useAuth()
  const { setOpen, open } = useSidebar()
  const { sidebarPinned } = usePreferences()
  const userPermissions = user?.permissions || []

  // Helper to check if user has required permission
  const hasPermission = (requiredPermission?: string) => {
    if (!requiredPermission) return true // No permission required
    return userPermissions.includes(requiredPermission)
  }

  const handleLinkClick = () => {
    if (!sidebarPinned) {
      setOpen(false)
    }
  }

  // While loading auth, show all items (will be filtered once loaded)
  // This prevents the jarring empty → populated transition
  const shouldShowAll = isLoading

  // Filter nav items based on permissions
  const filteredNavMain = shouldShowAll
    ? navMainItems
    : navMainItems.filter(item => hasPermission(item.requiredPermission))
  const filteredDocuments = shouldShowAll
    ? documentItems
    : documentItems.filter(item => hasPermission(item.requiredPermission))
  const filteredAdmin = shouldShowAll
    ? [] // Don't show admin items while loading for security
    : adminItems.filter(item => hasPermission(item.requiredPermission))
  const filteredSecondary = shouldShowAll
    ? navSecondaryItems
    : navSecondaryItems.filter(item => hasPermission(item.requiredPermission))

  // Calculate start indices for staggered animation
  let currentIndex = 0

  const navMainStartIndex = currentIndex
  if (filteredNavMain.length > 0) {
    currentIndex += filteredNavMain.length + 2 // +2 for Quick Upload and Chat
  }

  const documentsStartIndex = currentIndex
  if (filteredDocuments.length > 0) {
    currentIndex += filteredDocuments.length + 1 // +1 for More button
  }

  const adminStartIndex = currentIndex
  if (filteredAdmin.length > 0) {
    currentIndex += filteredAdmin.length + 1 // +1 for More button
  }

  const secondaryStartIndex = currentIndex

  return (
    <>
      {!sidebarPinned && (
        <div
          className="fixed left-0 top-0 bottom-0 z-50 w-4 bg-transparent"
          onMouseEnter={() => setOpen(true)}
          style={{ display: open ? "none" : "block" }}
        />
      )}
      <Sidebar
        collapsible="offcanvas"
        {...props}
        onMouseLeave={sidebarPinned ? undefined : () => setOpen(false)}
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="#">
                  <motion.img
                    src="https://www.emamiltd.in/wp-content/themes/emami/images/emami_new_logo2.png"
                    alt="Innux AI Logo"
                    className="h-8 w-auto"
                    initial={{ rotate: 270 }}
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                  />
                  <div className="flex items-baseline gap-2 leading-none">
                    <span className="text-lg font-bold tracking-tight ">Emami Agrotech</span>
                    {/* <span className="text-xs italic text-muted-foreground tracking-tight">
                      Nourishing People, Powering Progress
                    </span> */}
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {filteredNavMain.length > 0 && <NavMain items={filteredNavMain} startIndex={navMainStartIndex} onLinkClick={handleLinkClick} />}
          {filteredDocuments.length > 0 && <NavDocuments items={filteredDocuments} label="Documents" startIndex={documentsStartIndex} onLinkClick={handleLinkClick} />}
          {/* Admin section - only shown if user has any admin permissions */}
          {filteredAdmin.length > 0 && <NavDocuments items={filteredAdmin} label="Administration" startIndex={adminStartIndex} onLinkClick={handleLinkClick} />}
          <NavSecondary items={filteredSecondary} className="mt-auto" startIndex={secondaryStartIndex} onLinkClick={handleLinkClick} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
