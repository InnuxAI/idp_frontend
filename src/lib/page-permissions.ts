/**
 * Page Permission Configuration
 * Maps routes to required permissions for access control
 */

// Page permission constants - must match backend PagePermission enum
export const PAGE_PERMISSIONS = {
    DASHBOARD: "page:dashboard",
    AGRO_DASHBOARD: "page:agro_dashboard",
    KNOWLEDGE_GRAPH: "page:knowledge_graph",
    AGRO_CHAT: "page:agro_chat",
    FIELD_EXTRACTION: "page:field_extraction",
    ANALYTICS: "page:analytics",
    PROJECTS: "page:projects",
    TEAM: "page:team",
    AGRO_LIBRARY: "page:agro_library",
    DATA_LIBRARY: "page:data_library",
    SCHEMA_LIBRARY: "page:schema_library",
    REPORTS: "page:reports",
    SETTINGS: "page:settings",
    ADMIN: "page:admin",
    ROLE_MANAGEMENT: "page:role_management",
    HITL: "page:hitl",
} as const

export type PagePermission = (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS]

/**
 * Map of routes to required permissions
 * Routes not in this map are considered public (after authentication)
 */
export const ROUTE_PERMISSION_MAP: Record<string, PagePermission> = {
    "/dashboard": PAGE_PERMISSIONS.DASHBOARD,
    "/zete": PAGE_PERMISSIONS.KNOWLEDGE_GRAPH,
    "/agro-chat": PAGE_PERMISSIONS.AGRO_CHAT,
    "/agro-dashboard": PAGE_PERMISSIONS.AGRO_DASHBOARD,
    "/field-extraction": PAGE_PERMISSIONS.FIELD_EXTRACTION,
    "/2_way_match": PAGE_PERMISSIONS.ANALYTICS,
    "/projects": PAGE_PERMISSIONS.PROJECTS,
    "/team": PAGE_PERMISSIONS.TEAM,
    "/agro-library": PAGE_PERMISSIONS.AGRO_LIBRARY,
    "/data-library": PAGE_PERMISSIONS.DATA_LIBRARY,
    "/extraction-schemas": PAGE_PERMISSIONS.SCHEMA_LIBRARY,
    "/reports": PAGE_PERMISSIONS.REPORTS,
    "/settings": PAGE_PERMISSIONS.SETTINGS,
    "/admin": PAGE_PERMISSIONS.ADMIN,
    "/admin/roles": PAGE_PERMISSIONS.ROLE_MANAGEMENT,
    "/hitl": PAGE_PERMISSIONS.HITL,
}

/**
 * Get required permission for a given pathname
 * Handles nested routes by checking parent paths
 */
export function getPermissionForPath(pathname: string): PagePermission | null {
    // Exact match first
    if (ROUTE_PERMISSION_MAP[pathname]) {
        return ROUTE_PERMISSION_MAP[pathname]
    }

    // Check parent paths for nested routes
    const pathParts = pathname.split("/").filter(Boolean)
    while (pathParts.length > 0) {
        const parentPath = "/" + pathParts.join("/")
        if (ROUTE_PERMISSION_MAP[parentPath]) {
            return ROUTE_PERMISSION_MAP[parentPath]
        }
        pathParts.pop()
    }

    return null
}

/**
 * Check if user has permission to access a route
 */
export function hasRoutePermission(
    pathname: string,
    userPermissions: string[]
): boolean {
    const requiredPermission = getPermissionForPath(pathname)

    // No permission required for this route
    if (!requiredPermission) {
        return true
    }

    return userPermissions.includes(requiredPermission)
}

/**
 * Available page info for role creation UI
 */
export interface PageInfo {
    id: PagePermission
    name: string
    description: string
    route: string
}

export const AVAILABLE_PAGES: PageInfo[] = [
    { id: PAGE_PERMISSIONS.DASHBOARD, name: "Dashboard", description: "Main dashboard overview", route: "/dashboard" },
    { id: PAGE_PERMISSIONS.AGRO_DASHBOARD, name: "Agro Dashboard", description: "RAG analytics, HITL queue and document health", route: "/agro-dashboard" },
    { id: PAGE_PERMISSIONS.KNOWLEDGE_GRAPH, name: "Knowledge Graph", description: "Visualize data relationships", route: "/zete" },
    { id: PAGE_PERMISSIONS.AGRO_CHAT, name: "Agro Chat", description: "Chat with agricultural documents using AI", route: "/agro-chat" },
    { id: PAGE_PERMISSIONS.FIELD_EXTRACTION, name: "Field Extraction", description: "Extract data from documents", route: "/field-extraction" },
    { id: PAGE_PERMISSIONS.ANALYTICS, name: "Analytics", description: "Two-way matching and analytics", route: "/2_way_match" },
    { id: PAGE_PERMISSIONS.HITL, name: "Invoice Approval", description: "AI-powered invoice approval with human oversight", route: "/hitl" },
    { id: PAGE_PERMISSIONS.AGRO_LIBRARY, name: "Agro Library", description: "Access to Agro documentation", route: "/agro-library" },
    { id: PAGE_PERMISSIONS.DATA_LIBRARY, name: "Data Library", description: "Manage uploaded documents", route: "/data-library" },
    { id: PAGE_PERMISSIONS.SCHEMA_LIBRARY, name: "Schema Library", description: "Manage extraction schemas", route: "/extraction-schemas" },
    { id: PAGE_PERMISSIONS.SETTINGS, name: "Settings", description: "User settings and preferences", route: "/settings" },
    { id: PAGE_PERMISSIONS.ADMIN, name: "Admin Panel", description: "User management", route: "/admin" },
    { id: PAGE_PERMISSIONS.ROLE_MANAGEMENT, name: "Role Management", description: "Create and manage roles", route: "/admin/roles" },
]
