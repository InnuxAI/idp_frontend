"use client"

import { IconCirclePlusFilled, IconMail, IconMessageCircle, IconUpload, type Icon } from "@tabler/icons-react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"

// import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useDocumentContext } from "@/contexts/document-context"

export function NavMain({
  items,
  startIndex = 0,
  onLinkClick,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    disabled?: boolean
    tooltip?: string
  }[]
  startIndex?: number
  onLinkClick?: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { setUploadModalOpen } = useDocumentContext()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              onClick={() => {
                setUploadModalOpen(true)
                onLinkClick?.()
              }}
              asChild
            >
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: startIndex * 0.05 }}
              >
                <IconUpload />
                <span>Quick Upload</span>
              </motion.button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu> */}
        <SidebarMenu>
          {items.map((item, index) => (
            <SidebarMenuItem key={item.title}>
              {item.disabled ? (
                <SidebarMenuButton
                  tooltip={item.tooltip || item.title}
                  disabled={true}
                  className="opacity-50 cursor-not-allowed"
                  asChild
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (startIndex + 1 + index) * 0.05 }}
                    className="flex items-center gap-2 w-full"
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </motion.div>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  tooltip={item.tooltip || item.title}
                  asChild
                  className={pathname === item.url ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                >
                  <motion.a
                    href={item.url}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (startIndex + 1 + index) * 0.05 }}
                    onClick={onLinkClick}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </motion.a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
          {/* <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Chat with Documents"
              asChild
            >
              <motion.a
                href="/chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (startIndex + 1 + items.length) * 0.05 }}
                onClick={onLinkClick}
              >
                <IconMessageCircle />
                <span>Chat</span>
              </motion.a>
            </SidebarMenuButton>
          </SidebarMenuItem> */}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
