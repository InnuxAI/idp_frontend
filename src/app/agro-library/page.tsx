"use client";

import { AgroDocumentLibrary } from "@/components/agro-chat/AgroDocumentLibrary";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function AgroLibraryPage() {
    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset>
                {/* Header */}
                <header className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-100 dark:border-zinc-800 px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 !h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <span className="text-xs text-gray-400">Agro Chat</span>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-xs font-medium">
                                    Document Library
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                {/* Content */}
                <AgroDocumentLibrary />
            </SidebarInset>
        </SidebarProvider>
    );
}
