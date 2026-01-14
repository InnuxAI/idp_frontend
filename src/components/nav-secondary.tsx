"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { motion } from "framer-motion"

export function NavSecondary({
  items,
  startIndex = 0,
  onLinkClick,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
    tooltip?: string
  }[]
  startIndex?: number
  onLinkClick?: () => void
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item, index) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.tooltip || item.title}>
                <motion.a
                  href={item.url}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (startIndex + index) * 0.05 }}
                  onClick={onLinkClick}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </motion.a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
