"use client"

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Hash, 
  Calendar, 
  Mail, 
  Link, 
  ToggleLeft,
  Table as TableIcon,
  List,
  Braces
} from "lucide-react"

interface DynamicJsonRendererProps {
  data: any
  title?: string
  className?: string
}

export function DynamicJsonRenderer({ data, title, className = "" }: DynamicJsonRendererProps) {
  // Helper function to try parsing JSON strings and Python string representations
  const tryParseJson = (value: any) => {
    if (typeof value !== "string") return value
    
    const trimmed = value.trim()
    
    // Skip if it doesn't look like JSON or Python data structure
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value
    
    try {
      // First try parsing as JSON
      return JSON.parse(trimmed)
    } catch {
      try {
        // If JSON parsing fails, try parsing as Python string representation
        // Convert Python single quotes to JSON double quotes
        const jsonified = trimmed
          .replace(/'/g, '"')  // Replace single quotes with double quotes
          .replace(/True/g, 'true')  // Convert Python True to JSON true
          .replace(/False/g, 'false')  // Convert Python False to JSON false
          .replace(/None/g, 'null')  // Convert Python None to JSON null
        
        return JSON.parse(jsonified)
      } catch {
        return value
      }
    }
  }

  // Helper function to recursively parse JSON strings in the data
  const parseJsonStrings = (obj: any): any => {
    if (typeof obj === "string") {
      return tryParseJson(obj)
    }
    
    if (Array.isArray(obj)) {
      return obj.map(parseJsonStrings)
    }
    
    if (typeof obj === "object" && obj !== null) {
      const parsed: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        parsed[key] = parseJsonStrings(value)
      }
      return parsed
    }
    
    return obj
  }

  // Parse the input data to handle JSON strings
  const parsedData = parseJsonStrings(data)

  // Helper function to get appropriate icon based on data type
  const getValueIcon = (value: any) => {
    if (typeof value === "number") return <Hash className="h-3 w-3" />
    if (typeof value === "boolean") return <ToggleLeft className="h-3 w-3" />
    if (typeof value === "string") {
      // Check for email pattern
      if (value.includes("@") && value.includes(".")) return <Mail className="h-3 w-3" />
      // Check for URL pattern
      if (value.startsWith("http") || value.startsWith("www")) return <Link className="h-3 w-3" />
      // Check for date pattern (basic)
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value)) return <Calendar className="h-3 w-3" />
      return <FileText className="h-3 w-3" />
    }
    if (Array.isArray(value)) return <List className="h-3 w-3" />
    if (typeof value === "object") return <Braces className="h-3 w-3" />
    return <FileText className="h-3 w-3" />
  }

  // Helper function to format values for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (typeof value === "object" && !Array.isArray(value)) return "[Object]"
    if (Array.isArray(value) && !isArrayOfObjects(value)) return `[${value.length} items]`
    return String(value)
  }

  // Check if array contains objects (for table rendering)
  const isArrayOfObjects = (arr: any[]): boolean => {
    return arr.length > 0 && 
           arr.every(item => typeof item === "object" && !Array.isArray(item) && item !== null)
  }

  // Render table for array of objects
  const renderTable = (tableData: any[], fieldName: string) => {
    if (!isArrayOfObjects(tableData)) return null

    const columns = Array.from(
      new Set(tableData.flatMap(row => Object.keys(row)))
    )

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <TableIcon className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm capitalize">
            {fieldName.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
          </h4>
          <Badge variant="outline" className="text-xs">
            {tableData.length} rows
          </Badge>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((col) => (
                  <TableHead key={col} className="font-medium text-xs">
                    {String(col).replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-muted/30">
                  {columns.map((col) => (
                    <TableCell key={col} className="text-xs">
                      {formatValue(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Render nested object
  const renderNestedObject = (obj: Record<string, any>, depth = 0) => {
    const entries = Object.entries(obj)
    
    return (
      <div className={`space-y-3 ${depth > 0 ? "ml-4 pl-4 border-l-2 border-muted" : ""}`}>
        {entries.map(([key, value]) => {
          // Handle array of objects as table
          if (Array.isArray(value) && isArrayOfObjects(value)) {
            return (
              <div key={key}>
                {renderTable(value, key)}
              </div>
            )
          }

          // Handle nested objects
          if (typeof value === "object" && !Array.isArray(value) && value !== null) {
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Braces className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm capitalize">
                    {key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
                  </h4>
                </div>
                {renderNestedObject(value, depth + 1)}
              </div>
            )
          }

          // Handle simple arrays
          if (Array.isArray(value)) {
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getValueIcon(value)}
                    <span className="font-medium text-sm capitalize">
                      {key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {value.length} items
                  </Badge>
                </div>
                <div className="ml-6">
                  <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-2">
                    {value.map((item, index) => (
                      <div key={index} className="py-1">
                        {index + 1}. {formatValue(item)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          // Handle primitive values
          return (
            <div key={key} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                {getValueIcon(value)}
                <span className="font-medium text-sm capitalize">
                  {key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
                </span>
              </div>
              <div className="text-sm text-right max-w-xs truncate">
                {typeof value === "string" && value.startsWith("http") ? (
                  <a 
                    href={value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {value}
                  </a>
                ) : typeof value === "string" && value.includes("@") && value.includes(".") ? (
                  <a 
                    href={`mailto:${value}`}
                    className="text-blue-600 hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <span className={`${
                    typeof value === "number" ? "font-mono" : 
                    typeof value === "boolean" ? (value ? "text-green-600" : "text-red-600") : ""
                  }`}>
                    {formatValue(value)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Validate input data
  if (!parsedData || (typeof parsedData !== "object" && !Array.isArray(parsedData))) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No data to display</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle array of objects at root level
  if (Array.isArray(parsedData) && isArrayOfObjects(parsedData)) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <TableIcon className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>
              Table data with {parsedData.length} rows
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className="p-0">
          {renderTable(parsedData, title || "Data")}
        </CardContent>
      </Card>
    )
  }

  // Handle object or array of mixed types
  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Braces className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription>
            Extracted field data
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="p-6">
        {Array.isArray(parsedData) ? (
          <div className="space-y-4">
            {parsedData.map((item, index) => (
              <div key={index}>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline">Item {index + 1}</Badge>
                </div>
                {typeof item === "object" && !Array.isArray(item) ? 
                  renderNestedObject(item) : 
                  <div className="text-sm">{formatValue(item)}</div>
                }
                {index < parsedData.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        ) : (
          renderNestedObject(parsedData)
        )}
      </CardContent>
    </Card>
  )
}

export default DynamicJsonRenderer
