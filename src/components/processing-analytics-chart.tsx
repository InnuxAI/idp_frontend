"use client"
import { useEffect, useState } from "react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchProcessingAnalytics, ProcessingAnalytics } from "@/services/dashboardService"

const TIME_RANGES = [
    { label: "Last 3 months", days: 90 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 10 days", days: 10 },
]

export function ProcessingAnalyticsChart() {
    const [analytics, setAnalytics] = useState<ProcessingAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedRange, setSelectedRange] = useState(30)

    useEffect(() => {
        loadAnalytics(selectedRange)
    }, [selectedRange])

    const loadAnalytics = async (days: number) => {
        setLoading(true)
        try {
            const data = await fetchProcessingAnalytics(days)
            setAnalytics(data)
        } catch (error) {
            console.error("Failed to load analytics:", error)
        } finally {
            setLoading(false)
        }
    }

    // Format date for display (Jan 20 format)
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Determine tick interval based on selected range
    const getTickInterval = () => {
        if (selectedRange <= 10) return 1
        if (selectedRange <= 30) return 4
        return 10
    }

    if (loading) {
        return (
            <Card className="col-span-full">
                <CardHeader>
                    <CardDescription>Document Processing Analytics</CardDescription>
                    <CardTitle className="text-lg">Loading...</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
                </CardContent>
            </Card>
        )
    }

    if (!analytics || analytics.time_series.length === 0) {
        return (
            <Card className="col-span-full">
                <CardHeader>
                    <CardDescription>Document Processing Analytics</CardDescription>
                    <CardTitle className="text-lg">No data available</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center">
                    <div className="text-muted-foreground">No documents processed in the selected time range.</div>
                </CardContent>
            </Card>
        )
    }

    const { summary } = analytics

    return (
        <Card className="col-span-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardDescription>Document Processing Analytics</CardDescription>
                        <CardTitle className="text-sm font-normal text-muted-foreground mt-1">
                            {summary.total} documents processed ({summary.successful} successful, {summary.failed} failed, {summary.in_review} in review)
                        </CardTitle>
                    </div>
                    <div className="flex gap-1">
                        {TIME_RANGES.map((range) => (
                            <Button
                                key={range.days}
                                variant={selectedRange === range.days ? "default" : "outline"}
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => setSelectedRange(range.days)}
                            >
                                {range.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={analytics.time_series}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorSuccessful" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInReview" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                interval={getTickInterval()}
                                axisLine={{ stroke: 'var(--border)' }}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                axisLine={{ stroke: 'var(--border)' }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}
                                labelFormatter={(label) => formatDate(label as string)}
                                formatter={(value: number, name: string) => {
                                    const labels: Record<string, string> = {
                                        successful: 'Successful',
                                        failed: 'Failed',
                                        in_review: 'In Review'
                                    }
                                    return [value, labels[name] || name]
                                }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={30}
                                formatter={(value) => {
                                    const labels: Record<string, string> = {
                                        successful: 'Successful',
                                        failed: 'Failed',
                                        in_review: 'In-Review'
                                    }
                                    return labels[value] || value
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="successful"
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorSuccessful)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="failed"
                                stroke="#f97316"
                                fillOpacity={1}
                                fill="url(#colorFailed)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="in_review"
                                stroke="#a855f7"
                                fillOpacity={1}
                                fill="url(#colorInReview)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
