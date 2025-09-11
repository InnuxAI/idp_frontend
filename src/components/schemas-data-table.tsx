"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
  IconCalendar,
  IconSchema,
  IconFileText,
  IconDotsVertical,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

export function SchemasDataTable() {
  const router = useRouter()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:8000/api/schemas/')
        if (!response.ok) throw new Error('Failed to fetch schemas')
        
        const data = await response.json()
        setSchemas(data.schemas)
      } catch (error) {
        console.error('Error fetching schemas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchemas()
    // Refresh every 30 seconds
    const interval = setInterval(fetchSchemas, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleViewDetails = (schema: Schema) => {
    setSelectedSchema(schema)
    setShowDetailsDialog(true)
  }

  const handleExportSchema = (schema: Schema) => {
    const dataToExport = {
      id: schema.id,
      name: schema.json_name,
      description: schema.json_description,
      field_definitions: schema.json_string.field_definitions,
      created_at: schema.created_at,
      field_count: schema.field_count,
      required_field_count: schema.required_field_count
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${schema.json_name.replace(/\s+/g, '_')}_schema.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filteredSchemas = schemas.filter(schema =>
    schema.json_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (schema.json_description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  const getSchemaTypeFromName = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('invoice') || lowerName.includes('receipt') || lowerName.includes('financial')) {
      return { type: 'Financial', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
    } else if (lowerName.includes('contract') || lowerName.includes('legal') || lowerName.includes('agreement')) {
      return { type: 'Legal', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' }
    } else if (lowerName.includes('business') || lowerName.includes('corporate') || lowerName.includes('company')) {
      return { type: 'Business', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' }
    } else {
      return { type: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
    }
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Schemas...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Loading schema data...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconSchema className="size-5" />
                Extraction Schemas
              </CardTitle>
              <CardDescription>
                Manage your document extraction schemas and field definitions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search schemas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Button onClick={() => router.push('/field-extraction')}>
                <IconSchema className="size-4 mr-2" />
                New Schema
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schema Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Fields</TableHead>
                  <TableHead className="text-center">Required</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchemas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <IconFileText className="size-8" />
                        <p>No schemas found</p>
                        {searchTerm && (
                          <p className="text-sm">Try adjusting your search terms</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchemas.map((schema) => {
                    const schemaType = getSchemaTypeFromName(schema.json_name)
                    return (
                      <TableRow key={schema.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconSchema className="size-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{schema.json_name}</div>
                              <div className="text-sm text-muted-foreground">ID: {schema.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${schemaType.color} border-0`}>
                            {schemaType.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {schema.json_description || (
                              <span className="text-muted-foreground italic">No description</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{schema.field_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{schema.required_field_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <IconCalendar className="size-3" />
                            {format(new Date(schema.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(schema)}>
                                <IconEye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/field-extraction?schemaId=${schema.id}`)}>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit Schema
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportSchema(schema)}>
                                <IconDownload className="mr-2 h-4 w-4" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <IconTrash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Summary footer */}
          {filteredSchemas.length > 0 && (
            <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
              <div>
                Showing {filteredSchemas.length} of {schemas.length} schemas
              </div>
              <div className="flex items-center gap-4">
                <span>Total Fields: {schemas.reduce((sum, schema) => sum + schema.field_count, 0)}</span>
                <span>•</span>
                <span>Avg Fields: {Math.round((schemas.reduce((sum, schema) => sum + schema.field_count, 0) / Math.max(schemas.length, 1)) * 10) / 10}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconSchema className="size-5" />
              {selectedSchema?.json_name}
            </DialogTitle>
            <DialogDescription>
              Schema details and field definitions
            </DialogDescription>
          </DialogHeader>
          
          {selectedSchema && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Schema Name</h4>
                    <p className="text-sm">{selectedSchema.json_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Schema ID</h4>
                    <p className="text-sm">{selectedSchema.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Created At</h4>
                    <p className="text-sm">{format(new Date(selectedSchema.created_at), "PPP 'at' p")}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Total Fields</h4>
                    <p className="text-sm">{selectedSchema.field_count} ({selectedSchema.required_field_count} required)</p>
                  </div>
                </div>

                {/* Description */}
                {selectedSchema.json_description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                    <p className="text-sm p-3 bg-muted rounded-md">{selectedSchema.json_description}</p>
                  </div>
                )}

                {/* Field Definitions */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Field Definitions</h4>
                  <div className="space-y-3">
                    {selectedSchema.json_string.field_definitions?.map((field: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium flex items-center gap-2">
                              {field.label || field.name}
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              Name: {field.name} • Type: {field.type}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {field.type}
                          </Badge>
                        </div>
                        
                        {field.description && (
                          <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                        )}
                        
                        {field.options && field.options.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">Options: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {field.options.map((option: string, optIndex: number) => (
                                <Badge key={optIndex} variant="secondary" className="text-xs">
                                  {option}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {field.tableColumns && field.tableColumns.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">Table Columns: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {field.tableColumns.map((col: any, colIndex: number) => (
                                <Badge key={colIndex} variant="secondary" className="text-xs">
                                  {col.label} ({col.type})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
