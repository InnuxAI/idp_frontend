"use client"
import { IconTrendingDown, IconTrendingUp, IconFile, IconFileText, IconCheck, IconX } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchDashboardMetrics, DashboardMetrics } from "@/services/dashboardService"

export function SectionCards() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchDashboardMetrics()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to load dashboard metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
    // Refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [])
  if (loading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                --
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  // Define all possible document types with their colors
  const allDocTypes = {
    'PDF': { count: 0, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    'Word': { count: 0, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    'Text': { count: 0, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    'Image': { count: 0, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    'Other': { count: 0, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
  }

  // Merge actual counts with all types
  Object.entries(metrics.doc_type_counts).forEach(([type, count]) => {
    if (type in allDocTypes) {
      (allDocTypes as any)[type].count = count
    }
  })

  // Calculate document type percentages
  const totalDocs = Object.values(allDocTypes).reduce((sum, type) => sum + type.count, 0)
  const topDocType = Object.entries(allDocTypes).reduce(
    (max, [type, typeInfo]) => typeInfo.count > max.count ? { type, count: typeInfo.count } : max, 
    { type: 'PDF', count: 0 }
  )

  // Calculate today's success rate
  const todaySuccessRate = metrics.today_stats.total > 0 
    ? Math.round((metrics.today_stats.successful / metrics.today_stats.total) * 100)
    : 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      
      {/* Document Types Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Document Types</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalDocs}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconFile className="size-3" />
              {Object.keys(allDocTypes).length} Types
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-3 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Most common: {topDocType.type} ({topDocType.count}) <IconFileText className="size-4" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(allDocTypes).map(([type, typeInfo]) => (
              <Badge 
                key={type} 
                variant="secondary" 
                className={`${typeInfo.color} border-0 font-medium`}
              >
                {type}: {typeInfo.count}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>

      {/* Today's Processing Stats */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Today's Processed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.today_stats.total}
          </CardTitle>
          <CardAction>
            <Badge variant={todaySuccessRate >= 70 ? "default" : "destructive"}>
              {todaySuccessRate >= 70 ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
              {todaySuccessRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <span className="flex items-center gap-1">
              <IconCheck className="size-3 text-green-600" />
              {metrics.today_stats.successful} successful
            </span>
            <span className="flex items-center gap-1">
              <IconX className="size-3 text-red-600" />
              {metrics.today_stats.failed} failed
            </span>
          </div>
          <div className="text-muted-foreground">
            Document processing for {new Date().toLocaleDateString()}
          </div>
        </CardFooter>
      </Card>

      {/* Total Documents */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Documents</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.overview_stats.total_documents}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconFile className="size-3" />
              {metrics.overview_stats.total_schemas} Schemas
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics.overview_stats.total_extractions} extractions completed <IconFileText className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Across all document types
          </div>
        </CardFooter>
      </Card>

      {/* Overall Success Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Success Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.overview_stats.success_rate}%
          </CardTitle>
          <CardAction>
            <Badge variant={metrics.overview_stats.success_rate >= 70 ? "default" : "destructive"}>
              {metrics.overview_stats.success_rate >= 70 ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
              Overall
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics.overview_stats.success_rate >= 70 ? 'Strong' : 'Needs improvement'} performance <IconCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Extraction success across all documents
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
