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
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-medium tracking-tight text-foreground">Select Schema</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Choose an existing schema for field extraction</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
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
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-medium tracking-tight text-foreground">Select Schema</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">Choose an existing schema for field extraction</CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <Select
          value={selectedSchemaId?.toString()}
          onValueChange={(value) => {
            const schema = schemas?.find(s => s.id === parseInt(value));
            if (schema) {
              onSchemaSelect(schema);
            }
          }}
        >
          <SelectTrigger className="w-full font-inter bg-background">
            <SelectValue placeholder="Select a schema..." />
          </SelectTrigger>
          <SelectContent>
            {schemas?.map((schema) => (
              <SelectItem key={schema.id} value={schema.id.toString()} className="font-inter">
                <div className="flex items-center justify-between w-full">
                  <span>{schema.name}</span>
                  <Badge variant="secondary" className="ml-2 text-[10px] h-5">
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
            className="p-5 border border-border/60 rounded-xl bg-muted/35 dark:bg-muted/40 space-y-4"
          >
            <div>
              <h4 className="font-semibold text-lg text-foreground tracking-tight">{selectedSchema.name}</h4>
              {selectedSchema.description && (
                <p className="text-sm text-muted-foreground mt-1 font-inter">
                  {selectedSchema.description}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-inter">
                  Fields ({selectedSchema.fields.length})
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
                {selectedSchema.fields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3.5 bg-muted/50 dark:bg-muted/55 hover:bg-muted/65 dark:hover:bg-muted/65 rounded-md border border-border/40 transition-colors group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-1.5 rounded-md bg-background text-muted-foreground group-hover:text-primary transition-colors border border-border/40">
                        {getFieldTypeIcon(field.type)}
                      </div>
                      <span className="text-sm font-medium font-inter">{field.label}</span>
                      {field.required && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 font-inter">
                          Required
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                      {field.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
