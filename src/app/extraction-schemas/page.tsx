"use client"

import { motion } from "motion/react"
import { AppSidebar } from "@/components/app-sidebar"
import { SchemaMetricCards } from "@/components/schema-metric-cards"
import { SchemasDataTable } from "@/components/schemas-data-table"
import { SiteHeader } from "@/components/site-header"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function ExtractionSchemasPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#" className="dark:text-zinc-400 dark:hover:text-zinc-200">
                      Library
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                  <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="dark:text-zinc-100">Schema Library</BreadcrumbPage>
                  </BreadcrumbItem>
                </motion.div>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SchemaMetricCards />
              <SchemasDataTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
