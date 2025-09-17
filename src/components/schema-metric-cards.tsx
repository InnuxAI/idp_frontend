"use client"
import { IconSchema, IconCheck, IconClock, IconFileText } from "@tabler/icons-react"
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

interface Schema {
  id: number;
  json_name: string;
  json_description?: string;
  json_string: {
    field_definitions: any[];
  };
  created_at: string;
  field_count: number;
  required_field_count: number;
}

interface SchemaMetrics {
  total_schemas: number;
  total_fields: number;
  avg_fields_per_schema: number;
  most_recent_schema: string;
  schemas: Schema[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchSchemaMetrics(): Promise<SchemaMetrics> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/schemas/`);
    if (!response.ok) throw new Error('Failed to fetch schemas');
    
    const data = await response.json();
    const schemas = data.schemas;
    
    const total_fields = schemas.reduce((sum: number, schema: Schema) => sum + schema.field_count, 0);
    const avg_fields = schemas.length > 0 ? Math.round(total_fields / schemas.length * 10) / 10 : 0;
    
    // Find most recent schema
    const mostRecent = schemas.length > 0 
      ? schemas.reduce((latest: Schema, current: Schema) => 
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        ).json_name
      : 'None';

    return {
      total_schemas: schemas.length,
      total_fields,
      avg_fields_per_schema: avg_fields,
      most_recent_schema: mostRecent,
      schemas
    };
  } catch (error) {
    console.error('Failed to fetch schema metrics:', error);
    return {
      total_schemas: 0,
      total_fields: 0,
      avg_fields_per_schema: 0,
      most_recent_schema: 'None',
      schemas: []
    };
  }
}

export function SchemaMetricCards() {
  const [metrics, setMetrics] = useState<SchemaMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchSchemaMetrics()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to load schema metrics:', error)
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

  // Schema type distribution
  const schemaTypes = {
    'Business': { count: 0, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    'Financial': { count: 0, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    'Legal': { count: 0, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    'Other': { count: 0, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
  }

  // Classify schemas by name (simple heuristic)
  metrics.schemas.forEach(schema => {
    const name = schema.json_name.toLowerCase()
    if (name.includes('invoice') || name.includes('receipt') || name.includes('financial')) {
      schemaTypes['Financial'].count++
    } else if (name.includes('contract') || name.includes('legal') || name.includes('agreement')) {
      schemaTypes['Legal'].count++
    } else if (name.includes('business') || name.includes('corporate') || name.includes('company')) {
      schemaTypes['Business'].count++
    } else {
      schemaTypes['Other'].count++
    }
  })

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      
      {/* Total Schemas Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Schemas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.total_schemas}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconSchema className="size-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Schema definitions available <IconFileText className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Ready for document extraction
          </div>
        </CardFooter>
      </Card>

      {/* Total Fields Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Fields</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.total_fields}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCheck className="size-3" />
              {metrics.avg_fields_per_schema} avg
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Average {metrics.avg_fields_per_schema} fields per schema <IconFileText className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Extraction field definitions
          </div>
        </CardFooter>
      </Card>

      {/* Schema Categories */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Schema Categories</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {Object.keys(schemaTypes).length}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconSchema className="size-3" />
              Types
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-3 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Schema distribution by category <IconFileText className="size-4" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(schemaTypes).map(([type, typeInfo]) => (
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

      {/* Most Recent Schema */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Latest Schema</CardDescription>
          <CardTitle className="text-lg font-semibold @[250px]/card:text-xl truncate">
            {metrics.most_recent_schema}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconClock className="size-3" />
              Recent
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Most recently created schema <IconCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Last schema addition to system
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
