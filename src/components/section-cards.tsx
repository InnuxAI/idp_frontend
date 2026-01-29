"use client"
import { IconTrendingDown, IconTrendingUp, IconFile, IconFileText, IconCheck, IconX, IconMessageCircle, IconAlertCircle, IconClock } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { fetchDashboardMetrics, DashboardMetrics } from "@/services/dashboardService"
import { fetchBusinessInsights, BusinessInsights } from "@/services/dashboardService"

export function SectionCards() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [insights, setInsights] = useState<BusinessInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [metricsData, insightsData] = await Promise.all([
          fetchDashboardMetrics(),
          fetchBusinessInsights()
        ])
        setMetrics(metricsData)
        setInsights(insightsData)
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
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {[...Array(3)].map((_, i) => (
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

  // --- 1. Document Types Logic ---
  const docTypeColors: Record<string, string> = {
    'MSA': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'SOW': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Invoice': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'NDA': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    'VisitingCard': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Brochure': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    'Organization': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  }
  const defaultColor = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'

  // Access nested graph_stats
  const graphStats = metrics.graph_stats || { total_documents: 0, doc_type_counts: {}, today_processed: 0 }
  const totalDocs = graphStats.total_documents
  // Filter to only Brochure and VisitingCard
  const allowedTypes = ['Brochure', 'VisitingCard']
  const sortedTypes = Object.entries(graphStats.doc_type_counts || {})
    .filter(([type]) => allowedTypes.includes(type))
    .sort(([, a], [, b]) => b - a)

  const topType = sortedTypes[0] || ['None', 0]

  // --- 2. Chat Query Logic ---
  const chatStats = metrics.chat_stats || { total_queries: 0, success_rate: 0, refusal_reasons: [] }
  const { total_queries, success_rate, refusal_reasons } = chatStats

  // Pie Chart Data for Refusals - strip "Query blocked: " prefix for cleaner display
  const pieData = (refusal_reasons || []).map(r => {
    const rawReason = r.reason || 'Unknown'
    const cleanReason = rawReason.replace(/^Query blocked:\s*/i, '')
    const displayName = cleanReason.length > 25 ? cleanReason.substring(0, 25) + '...' : cleanReason
    return {
      name: displayName,
      value: r.count,
      fullReason: cleanReason
    }
  })

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4'];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-3">

      {/* 1. Document Types Card (Dynamic from Neo4j) */}
      <Card className="@container/card flex flex-col">
        <CardHeader>
          <CardDescription>Document Types</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalDocs}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconFile className="size-3 mr-1" />
              {sortedTypes.length} Types
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex flex-wrap gap-2">
            {sortedTypes.slice(0, 6).map(([type, count]) => (
              <Badge
                key={type}
                variant="secondary"
                className={`${docTypeColors[type] || defaultColor} border-0 font-medium`}
              >
                {type}: {count}
              </Badge>
            ))}
            {sortedTypes.length > 6 && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                +{sortedTypes.length - 6} more
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-1.5 text-sm pt-0">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            Most common: <span className="text-foreground">{topType[0]} ({topType[1]})</span>
          </div>
        </CardFooter>
      </Card>

      {/* 2. Today's Processed + Recent Activity (Combined Card) */}
      <Card className="@container/card flex flex-col">
        {/* Top Half: Today's Processed */}
        <div className="border-b">
          <CardHeader className="pb-1 pt-3">
            <div className="flex items-center justify-between">
              <CardDescription>Today's Processed</CardDescription>
              <Badge variant="outline" className="text-xs">
                <IconCheck className="size-3 text-green-600 mr-1" />
                Active
              </Badge>
            </div>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {graphStats.today_processed}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-xs text-muted-foreground">
              Documents ingested today • {new Date().toLocaleDateString()}
            </div>
          </CardContent>
        </div>
        {/* Bottom Half: Recent Activity */}
        <div className="flex-1">
          <CardHeader className="pb-1 pt-3">
            <div className="flex items-center gap-2">
              <IconFileText className="size-4 text-primary" />
              <CardDescription>Recent Activity</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            {insights?.recent_documents && insights.recent_documents.length > 0 ? (
              <div className="space-y-2">
                {insights.recent_documents.slice(0, 3).map((doc, i) => (
                  <div key={doc.doc_id || i} className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconFileText className="size-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" title={doc.title}>
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {doc.doc_type}
                        </Badge>
                        <IconClock className="size-2" />
                        {doc.time_ago}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[60px] text-xs text-muted-foreground">
                No recent documents
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* 3. Chat Quality (Success Rate & Refusal Reasons) - COMBINED with Bar Chart */}
      <Card className="@container/card col-span-1 md:col-span-2 lg:col-span-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardDescription>Chat Quality</CardDescription>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {success_rate}%
            </CardTitle>
            <Badge variant={success_rate >= 80 ? "default" : "destructive"}>
              {success_rate >= 80 ? <IconCheck className="size-3 mr-1" /> : <IconAlertCircle className="size-3 mr-1" />}
              Success Rate
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on {total_queries} queries
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-2">
          {/* Bar Chart - Success vs Refusal */}
          <div className="h-[100px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'Queries',
                    Successful: chatStats.raw_stats?.ALLOW || 0,
                    Refused: chatStats.raw_stats?.BLOCK || 0,
                  }
                ]}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={50} />
                <Tooltip
                  contentStyle={{ fontSize: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="Successful" fill="#22c55e" name="Successful" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Refused" fill="#ef4444" name="Refused" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Refusal Reasons */}
          {refusal_reasons.length > 0 ? (
            <div className="flex items-start justify-between border-t pt-3">
              <div className="w-[80px] h-[80px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={35}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [value, props.payload.fullReason]}
                      contentStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 pl-3 space-y-1">
                <p className="text-xs font-medium mb-1">Top Refusal Reasons:</p>
                {pieData.slice(0, 3).map((d, i) => (
                  <div key={i} className="flex items-center text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="truncate" title={d.fullReason}>{d.name}</span>
                    <span className="ml-auto font-mono text-xs">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[60px] text-sm text-muted-foreground border-t pt-3">
              No refusals recorded yet.
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
