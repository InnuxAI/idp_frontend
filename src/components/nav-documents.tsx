"use client"

import { motion } from "motion/react"
import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  type Icon,
} from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavDocuments({
  items,
  label = "Documents",
  startIndex = 0,
  onLinkClick,
}: {
  items: {
    name: string
    url: string
    icon: Icon
    disabled?: boolean
    tooltip?: string
  }[]
  label?: string
  startIndex?: number
  onLinkClick?: () => void
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.max(0, startIndex - 1) * 0.05 }}
        >
          {label}
        </motion.span>
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              disabled={item.disabled}
              className={item.disabled ? "opacity-50 cursor-not-allowed" : undefined}
              tooltip={item.tooltip || item.name}
            >
              {item.disabled ? (
                <motion.span
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (startIndex + index) * 0.05 }}
                >
                  <item.icon />
                  <span>{item.name}</span>
                </motion.span>
              ) : (
                <motion.a
                  href={item.name === 'Data Library' ? '/data-library' : item.url}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (startIndex + index) * 0.05 }}
                  onClick={onLinkClick}
                >
                  <item.icon />
                  <span>{item.name}</span>
                </motion.a>
              )}
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={item.disabled}>
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                  style={{
                    visibility: item.disabled ? 'hidden' : 'visible',
                    pointerEvents: item.disabled ? 'none' : 'auto'
                  }}
                >
                  <IconDots />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              {!item.disabled && (
                <DropdownMenuContent
                  className="w-24 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <IconFolder />
                    <span>Open</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconShare3 />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <IconTrash />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70" asChild>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (startIndex + items.length) * 0.05 }}
            >
              <IconDots className="text-sidebar-foreground/70" />
              <span>More</span>
            </motion.button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
