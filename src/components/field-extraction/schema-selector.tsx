"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Calendar, Hash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/services/api';
import { FieldDefinition } from './field-extraction-component';

interface Schema {
  id: number;
  name: string;
  description: string;
  fields: FieldDefinition[];
  created_at: string;
}

interface SchemaSelectorProps {
  onSchemaSelect: (schema: Schema) => void;
  selectedSchemaId?: number;
}

export function SchemaSelector({ onSchemaSelect, selectedSchemaId }: SchemaSelectorProps) {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      console.log('Loading schemas...'); // Debug log
      const response = await apiService.getSchemas();
      console.log('Schemas loaded:', response); // Debug log
      setSchemas(response);
    } catch (error) {
      console.error('Failed to load schemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedSchema = schemas?.find(s => s.id === selectedSchemaId);

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': case 'email': case 'url':
        return <FileText className="h-3 w-3" />;
      case 'number':
        return <Hash className="h-3 w-3" />;
      case 'date':
        return <Calendar className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  if (loading || !schemas) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Schema</CardTitle>
          <CardDescription>Choose an existing schema for field extraction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!schemas || schemas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Schemas Available</CardTitle>
          <CardDescription>You need to create a schema first before uploading files</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Go to the "Define Fields" tab to create your first extraction schema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Schema</CardTitle>
        <CardDescription>Choose an existing schema for field extraction</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedSchemaId?.toString()}
          onValueChange={(value) => {
            const schema = schemas?.find(s => s.id === parseInt(value));
            if (schema) {
              onSchemaSelect(schema);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a schema..." />
          </SelectTrigger>
          <SelectContent>
            {schemas?.map((schema) => (
              <SelectItem key={schema.id} value={schema.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <span>{schema.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {schema.fields.length} fields
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSchema && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-lg bg-muted/50"
          >
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">{selectedSchema.name}</h4>
                {selectedSchema.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSchema.description}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Fields ({selectedSchema.fields.length})
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {selectedSchema.fields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-background rounded border"
                    >
                      <div className="flex items-center space-x-2">
                        {getFieldTypeIcon(field.type)}
                        <span className="text-sm font-medium">{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            Required
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
