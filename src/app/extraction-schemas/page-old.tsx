import { AppSidebar } from "@/components/app-sidebar"
import { SchemaMetricCards } from "@/components/schema-metric-cards"
import { SchemasDataTable } from "@/components/schemas-data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function ExtractionSchemasPage() {

  const handleDeleteSchema = async (schemaId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/schemas/${schemaId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete schema');
      
      // Remove from state
      setSchemas(prev => prev.filter(s => s.id !== schemaId));
      toast.success('Schema deleted successfully');
    } catch (error) {
      console.error('Error deleting schema:', error);
      toast.error('Failed to delete schema');
    }
  };

  const handleCopySchemaId = (schemaId: number) => {
    navigator.clipboard.writeText(schemaId.toString());
    toast.success('Schema ID copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSchemas = schemas.filter(schema =>
    schema.json_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (schema.json_description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handlePreviewSchema = (schema: Schema) => {
    setSelectedSchema(schema);
    setShowPreviewDialog(true);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mb-6"
                >
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                    className="text-3xl font-bold mb-2"
                  >
                    Extraction Schemas
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                    className="text-muted-foreground"
                  >
                    Manage your saved field extraction schemas and templates
                  </motion.p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-6"
                >
                  {/* Header Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search schemas..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 w-80"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button asChild>
                        <a href="/field-extraction">
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Schema
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                          <Database className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{schemas.length}</p>
                            <p className="text-xs text-muted-foreground">Total Schemas</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="text-2xl font-bold">
                              {schemas.reduce((sum, s) => sum + s.field_count, 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Fields</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-8 w-8 text-purple-500" />
                          <div>
                            <p className="text-2xl font-bold">
                              {schemas.length > 0 ? formatDate(schemas[0].created_at).split(',')[0] : 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">Latest Schema</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Schemas Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Saved Schemas</CardTitle>
                      <CardDescription>
                        {filteredSchemas.length} of {schemas.length} schemas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Loading schemas...</p>
                        </div>
                      ) : filteredSchemas.length === 0 ? (
                        <div className="text-center py-8">
                          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-lg font-semibold mb-2">No schemas found</p>
                          <p className="text-muted-foreground mb-4">
                            {searchTerm ? 'No schemas match your search criteria.' : 'Create your first extraction schema to get started.'}
                          </p>
                          <Button asChild>
                            <a href="/field-extraction">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Schema
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Fields</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredSchemas.map((schema) => (
                                <TableRow key={schema.id}>
                                  <TableCell>
                                    <div className="font-medium">{schema.json_name}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="max-w-[300px] truncate text-muted-foreground">
                                      {schema.json_description || 'No description'}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="secondary">
                                        {schema.field_count} fields
                                      </Badge>
                                      {schema.required_field_count > 0 && (
                                        <Badge variant="outline">
                                          {schema.required_field_count} required
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {formatDate(schema.created_at)}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <span className="sr-only">Open menu</span>
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() => handlePreviewSchema(schema)}
                                        >
                                          <Eye className="mr-2 h-4 w-4" />
                                          Preview
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleCopySchemaId(schema.id)}
                                        >
                                          <Copy className="mr-2 h-4 w-4" />
                                          Copy ID
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                              onSelect={(e) => e.preventDefault()}
                                              className="text-destructive"
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
                                            </DropdownMenuItem>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the
                                                schema "{schema.json_name}" and all its field definitions.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => handleDeleteSchema(schema.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schema Preview: {selectedSchema?.json_name}</DialogTitle>
              <DialogDescription>
                {selectedSchema?.json_description || 'No description provided'}
              </DialogDescription>
            </DialogHeader>
            {selectedSchema && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Total Fields</p>
                    <p className="text-2xl font-bold">{selectedSchema.field_count}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Required Fields</p>
                    <p className="text-2xl font-bold">{selectedSchema.required_field_count}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Field Definitions:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedSchema.json_string.field_definitions.map((field: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{field.label}</p>
                            <p className="text-sm text-muted-foreground">{field.name}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{field.type}</Badge>
                            {field.required && <Badge variant="destructive">Required</Badge>}
                          </div>
                        </div>
                        {field.description && (
                          <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}