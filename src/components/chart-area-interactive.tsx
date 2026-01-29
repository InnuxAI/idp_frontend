"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function ChartAreaInteractive() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Time-series data coming soon</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
        Chart unavailable
      </CardContent>
    </Card>
  )
}
