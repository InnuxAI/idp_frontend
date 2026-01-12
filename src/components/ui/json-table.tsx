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
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    Hash,
    Calendar,
    Mail,
    Link as LinkIcon,
    ToggleLeft,
    List,
    Braces
} from "lucide-react"

interface JsonTableProps {
    data: any
    className?: string
    maxHeight?: string
}

export function JsonTable({ data, className = "", maxHeight }: JsonTableProps) {
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
            if (value.startsWith("http") || value.startsWith("www")) return <LinkIcon className="h-3 w-3" />
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
        if (typeof value === "object" && !Array.isArray(value)) return value.title || value.name || value.id || "[Object]"
        if (Array.isArray(value) && !isArrayOfObjects(value)) return `[${value.length} items]`
        return String(value)
    }

    // Check if array contains objects (for table rendering)
    const isArrayOfObjects = (arr: any[]): boolean => {
        return arr.length > 0 &&
            arr.every(item => typeof item === "object" && !Array.isArray(item) && item !== null)
    }

    // Render table for array of objects
    const renderTable = (tableData: any[]) => {
        if (!isArrayOfObjects(tableData)) return null

        const columns = Array.from(
            new Set(tableData.flatMap(row => Object.keys(row)))
        )

        return (
            <div className="rounded-md border overflow-hidden my-2">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50 h-8">
                            {columns.map((col) => (
                                <TableHead key={col} className="h-8 px-2 py-1 text-xs font-medium">
                                    {String(col).replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableData.map((row, rowIndex) => (
                            <TableRow key={rowIndex} className="hover:bg-muted/30 h-8">
                                {columns.map((col) => (
                                    <TableCell key={col} className="p-2 text-xs">
                                        {typeof row[col] === 'object' ? formatValue(row[col]) : (
                                            <span className={typeof row[col] === 'number' ? 'font-mono' : ''}>
                                                {formatValue(row[col])}
                                            </span>
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    // Render nested object
    const renderNestedObject = (obj: Record<string, any>, depth = 0) => {
        const entries = Object.entries(obj)

        return (
            <div className={`space-y-1 ${depth > 0 ? "ml-3 pl-3 border-l text-sm" : ""}`}>
                {entries.map(([key, value]) => {
                    // Handle array of objects as table
                    if (Array.isArray(value) && isArrayOfObjects(value)) {
                        return (
                            <div key={key} className="py-1">
                                <div className="flex items-center space-x-2 text-xs font-semibold text-muted-foreground mb-1">
                                    <List className="h-3 w-3" />
                                    <span className="capitalize">{key.replace(/_/g, " ")}</span>
                                </div>
                                {renderTable(value)}
                            </div>
                        )
                    }

                    // Handle nested objects
                    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
                        return (
                            <div key={key} className="py-1">
                                <div className="flex items-center space-x-2 text-xs font-semibold text-muted-foreground mb-1">
                                    <Braces className="h-3 w-3" />
                                    <span className="capitalize">{key.replace(/_/g, " ")}</span>
                                </div>
                                {renderNestedObject(value, depth + 1)}
                            </div>
                        )
                    }

                    // Handle simple arrays
                    if (Array.isArray(value)) {
                        return (
                            <div key={key} className="py-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        {getValueIcon(value)}
                                        <span className="text-xs font-semibold text-muted-foreground capitalize">
                                            {key.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                        {value.length}
                                    </Badge>
                                </div>
                                <div className="ml-5 mt-1 text-xs text-muted-foreground">
                                    {value.map((item, i) => (
                                        <div key={i} className="border-l pl-2 py-0.5">{formatValue(item)}</div>
                                    )).slice(0, 5)}
                                    {value.length > 5 && <div className="pl-2 text-[10px] opacity-70">... {value.length - 5} more</div>}
                                </div>
                            </div>
                        )
                    }

                    // Handle primitive values
                    return (
                        <div key={key} className="flex items-start justify-between py-1.5 gap-4 border-b last:border-0 border-muted/50">
                            <div className="flex items-center space-x-2 shrink-0">
                                <div className="mt-0.5 text-muted-foreground/70">{getValueIcon(value)}</div>
                                <span className="text-xs font-medium text-muted-foreground capitalize">
                                    {key.replace(/_/g, " ")}
                                </span>
                            </div>
                            <div className="text-xs text-right break-words max-w-[200px]">
                                {typeof value === "string" && value.startsWith("http") ? (
                                    <a
                                        href={value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Link
                                    </a>
                                ) : (
                                    <span className={`${typeof value === "number" ? "font-mono" :
                                            typeof value === "boolean" ? (value ? "text-green-600 dark:text-green-400 font-bold" : "text-red-600 dark:text-red-400 font-bold") : ""
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

    if (!parsedData || (typeof parsedData !== "object" && !Array.isArray(parsedData))) {
        return <div className="text-xs text-muted-foreground p-2">No data available</div>
    }

    return (
        <div className={`w-full ${className}`}>
            {maxHeight ? (
                <div className="overflow-y-auto pr-1" style={{ maxHeight }}>
                    {Array.isArray(parsedData) && isArrayOfObjects(parsedData)
                        ? renderTable(parsedData)
                        : renderNestedObject(parsedData)}
                </div>
            ) : (
                Array.isArray(parsedData) && isArrayOfObjects(parsedData)
                    ? renderTable(parsedData)
                    : renderNestedObject(parsedData)
            )}
        </div>
    )
}
