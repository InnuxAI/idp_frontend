"use client"

import React from 'react';
import { motion } from 'motion/react';
import { FileText, Hash, Calendar, Check, Mail, Link, ChevronDown, Table } from 'lucide-react';
import { FieldDefinition } from './field-extraction-component';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface FieldDefinitionPreviewProps {
  definitions: FieldDefinition[];
}

export function FieldDefinitionPreview({ definitions }: FieldDefinitionPreviewProps) {
  const getFieldIcon = (type: FieldDefinition['type']) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'number':
        return <Hash className="h-4 w-4" />;
      case 'date':
        return <Calendar className="h-4 w-4" />;
      case 'boolean':
        return <Check className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'url':
        return <Link className="h-4 w-4" />;
      case 'dropdown':
        return <ChevronDown className="h-4 w-4" />;
      case 'table':
        return <Table className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFieldTypeColor = (type: FieldDefinition['type']) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'number':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'date':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'boolean':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'email':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'url':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'dropdown':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'table':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (definitions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No fields defined yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {definitions.map((field, index) => (
        <motion.div
          key={field.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                  {getFieldIcon(field.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-semibold">{field.label}</h4>
                    <Badge className={getFieldTypeColor(field.type)}>
                      {field.type}
                    </Badge>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-mono font-medium">{field.name}</span>
                    {field.description && ` • ${field.description}`}
                  </p>

                  {/* Dropdown options */}
                  {field.type === 'dropdown' && field.options && field.options.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Options:</p>
                      <div className="flex flex-wrap gap-1">
                        {field.options.map((option, optIndex) => (
                          <Badge key={optIndex} variant="outline" className="text-xs">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Table columns */}
                  {field.type === 'table' && field.tableColumns && field.tableColumns.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center space-x-1">
                        <Table className="h-3 w-3" />
                        <span>Table Columns:</span>
                      </p>
                      <div className="space-y-2">
                        {field.tableColumns.map((column, colIndex) => (
                          <div key={colIndex} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <span className="font-medium text-sm">{column.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({column.name})
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getFieldTypeColor(column.type)}`}
                            >
                              {column.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Summary Statistics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">{definitions.length}</p>
            <p className="text-xs text-muted-foreground">Total Fields</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">
              {definitions.filter(f => f.required).length}
            </p>
            <p className="text-xs text-muted-foreground">Required</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">
              {definitions.filter(f => f.type === 'table').length}
            </p>
            <p className="text-xs text-muted-foreground">Tables</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">
              {definitions.reduce((acc, f) => acc + (f.tableColumns?.length || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Columns</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
