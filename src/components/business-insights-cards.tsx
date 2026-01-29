"use client"
import { useEffect, useState } from "react"
import {
    IconBuilding,
    IconFileText,
    IconClock,
    IconAlertTriangle,
    IconChartBar
} from "@tabler/icons-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined'
        ? (sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token'))
        : null
    return token ? { Authorization: `Bearer ${token}` } : {}
}

interface BusinessInsights {
    top_organizations: Array<{
        name: string
        doc_count: number
        doc_types: string[]
    }>
    recent_documents: Array<{
        doc_id: string
        title: string
        doc_type: string
        time_ago: string
    }>
    pending_approvals: {
        count: number
        samples: Array<{
            vendor: string
            invoice: string
            amount: number
        }>
    }
    relationship_summary: {
        total: number
        top_types: Array<{
            type: string
            count: number
        }>
    }
}

export function BusinessInsightsCards() {
    const [insights, setInsights] = useState<BusinessInsights | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInsights()
    }, [])

    const fetchInsights = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/zete/dashboard/insights`, {
                headers: getAuthHeaders()
            })
            if (response.ok) {
                const data = await response.json()
                setInsights(data)
            }
        } catch (error) {
            console.error('Failed to fetch business insights:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-4 bg-muted rounded w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-20 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!insights) return null

    const { top_organizations, recent_documents, pending_approvals, relationship_summary } = insights

    // Prepare chart data for top organizations
    const orgChartData = top_organizations.slice(0, 5).map(org => ({
        name: org.name.length > 15 ? org.name.substring(0, 15) + '...' : org.name,
        fullName: org.name,
        documents: org.doc_count
    }))

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 lg:px-6">
            {/* Top Organizations - Bar Chart - COMMENTED OUT */}
            {/* <Card className="col-span-1 md:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <IconBuilding className="size-4 text-primary" />
                        <CardDescription>Top Vendors/Clients</CardDescription>
                    </div>
                    <CardTitle className="text-lg">Organizations by Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    {orgChartData.length > 0 ? (
                        <div className="h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={orgChartData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                                >
                                    <XAxis type="number" tick={{ fontSize: 10 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 10 }}
                                        width={80}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [value, 'Documents']}
                                        labelFormatter={(label: string, payload: any) => payload?.[0]?.payload?.fullName || label}
                                        contentStyle={{ fontSize: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                                    />
                                    <Bar dataKey="documents" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                            No organization data yet
                        </div>
                    )}
                </CardContent>
            </Card> */}

            {/* Recent Documents - Activity Feed - COMMENTED OUT (now in section-cards) */}
            {/* <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <IconFileText className="size-4 text-primary" />
                        <CardDescription>Recent Activity</CardDescription>
                    </div>
                    <CardTitle className="text-lg">Latest Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    {recent_documents.length > 0 ? (
                        <div className="space-y-3">
                            {recent_documents.slice(0, 4).map((doc, i) => (
                                <div key={doc.doc_id || i} className="flex items-start gap-3">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <IconFileText className="size-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" title={doc.title}>
                                            {doc.title}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                {doc.doc_type}
                                            </Badge>
                                            <span className="flex items-center gap-1">
                                                <IconClock className="size-3" />
                                                {doc.time_ago}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                            No recent documents
                        </div>
                    )}
                </CardContent>
            </Card> */}

            {/* Pending Approvals + Knowledge Graph Stats - COMMENTED OUT */}
            {/* <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <IconAlertTriangle className="size-4 text-orange-500" />
                        <CardDescription>Action Required</CardDescription>
                    </div>
                    <CardTitle className="text-lg">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                            <div>
                                <p className="text-2xl font-bold">{pending_approvals.count}</p>
                                <p className="text-xs text-muted-foreground">Invoices awaiting review</p>
                            </div>
                            {pending_approvals.count > 0 && (
                                <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
                                    Needs Action
                                </Badge>
                            )}
                        </div>
                        <div className="pt-2 border-t">
                            <div className="flex items-center gap-2 mb-2">
                                <IconChartBar className="size-4 text-primary" />
                                <span className="text-xs font-medium">Knowledge Graph</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-muted/50 rounded">
                                    <p className="font-bold text-lg">{relationship_summary.total}</p>
                                    <p className="text-muted-foreground">Connections</p>
                                </div>
                                <div className="p-2 bg-muted/50 rounded">
                                    <p className="font-bold text-lg">{relationship_summary.top_types?.length || 0}</p>
                                    <p className="text-muted-foreground">Link Types</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card> */}
        </div>
    )
}
