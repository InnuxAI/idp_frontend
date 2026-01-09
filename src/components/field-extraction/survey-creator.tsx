"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  X,
  Table,
  Code,
  Eye,
  List,
  RotateCcw,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Mail,
  Link,
  ChevronDown,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldDefinition, TableColumn } from './field-extraction-component';

interface Field {
  name: string;
  label: string;
  type: FieldDefinition['type'];
  required: boolean;
  description: string;
  options: string[];
  tableColumns: TableColumn[];
}

interface SurveyCreatorProps {
  onSurveyChange: (survey: any) => void;
  onFieldDefinitionsChange: (definitions: FieldDefinition[]) => void;
}

const getFieldTypeIcon = (type: FieldDefinition['type']) => {
  switch (type) {
    case 'text':
      return Type;
    case 'number':
      return Hash;
    case 'date':
      return Calendar;
    case 'boolean':
      return ToggleLeft;
    case 'email':
      return Mail;
    case 'url':
      return Link;
    case 'dropdown':
      return ChevronDown;
    case 'table':
      return Table;
    default:
      return Type;
  }
};

const FieldTypeSelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
  const IconComponent = getFieldTypeIcon(value as FieldDefinition['type']);
  return (
    <SelectItem value={value}>
      <div className="flex items-center gap-2">
        <IconComponent className="h-4 w-4" />
        {children}
      </div>
    </SelectItem>
  );
};

export function SurveyCreator({ onSurveyChange, onFieldDefinitionsChange }: SurveyCreatorProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [currentTableColumn, setCurrentTableColumn] = useState<TableColumn>({
    name: '',
    label: '',
    type: 'text'
  });
  const [currentField, setCurrentField] = useState<Field>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    description: '',
    options: [],
    tableColumns: []
  });

  useEffect(() => {
    const definitions: FieldDefinition[] = fields.map(field => ({
      name: field.name,
      type: field.type,
      label: field.label,
      required: field.required,
      description: field.description,
      options: field.options.length > 0 ? field.options : undefined,
      tableColumns: field.tableColumns.length > 0 ? field.tableColumns : undefined
    }));

    onFieldDefinitionsChange(definitions);
    onSurveyChange({ fields: definitions });
  }, [fields]);

  const addField = () => {
    if (!currentField.name || !currentField.label) return;
    if (fields.some(f => f.name === currentField.name)) return;

    setFields(prev => [...prev, { ...currentField }]);
    setCurrentField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      description: '',
      options: [],
      tableColumns: []
    });
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const addTableColumn = () => {
    if (!currentTableColumn.name || !currentTableColumn.label) return;
    if (currentField.tableColumns.some(col => col.name === currentTableColumn.name)) return;

    setCurrentField(prev => ({
      ...prev,
      tableColumns: [...prev.tableColumns, { ...currentTableColumn }]
    }));

    setCurrentTableColumn({
      name: '',
      label: '',
      type: 'text'
    });
  };

  const removeTableColumn = (index: number) => {
    setCurrentField(prev => ({
      ...prev,
      tableColumns: prev.tableColumns.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
      {/* Header with JSON Toggle */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Field Builder
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and configure extraction fields for your documents
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowJsonPreview(!showJsonPreview)}
          className="h-9 px-3"
        >
          {showJsonPreview ? (
            <>
              <Eye className="h-4 w-4 mr" />
              Hide Schema
            </>
          ) : (
            <>
              <Code className="h-4 w-4 mr" />
              View Schema
            </>
          )}
        </Button>
      </div>

      {/* JSON Preview */}
      {showJsonPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                JSON Schema Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  readOnly
                  className="font-mono text-xs min-h-[200px] resize-none bg-muted/30"
                  value={JSON.stringify(
                    fields.map((field) => ({
                      name: field.name,
                      type: field.type,
                      label: field.label,
                      required: field.required,
                      description: field.description,
                      ...(field.options.length > 0 && {
                        options: field.options,
                      }),
                      ...(field.tableColumns.length > 0 && {
                        tableColumns: field.tableColumns,
                      }),
                    })),
                    null,
                    2
                  )}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(fields, null, 2)
                    );
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Form */}
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="form" className="text-sm font-medium">
            <Plus className="h-4 w-4" />
            Add Field
          </TabsTrigger>
          <TabsTrigger value="list" className="text-sm font-medium">
            <Eye className="h-4 w-4" />
            Field List ({fields.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="mt-6">
          <Card>
            <CardContent className="p-6 space-y-6 overflow-y-auto">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Field Name
                  </Label>
                  <Input
                    value={currentField.name}
                    onChange={(e) =>
                      setCurrentField((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="company_name"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use lowercase with underscores
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Display Label
                  </Label>
                  <Input
                    value={currentField.label}
                    onChange={(e) =>
                      setCurrentField((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    placeholder="Company Name"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Human-readable field name
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Field Type
                  </Label>
                  <Select
                    value={currentField.type}
                    onValueChange={(value) =>
                      setCurrentField((prev) => ({
                        ...prev,
                        type: value as FieldDefinition["type"],
                        tableColumns:
                          value === "table" ? prev.tableColumns : [],
                      }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <FieldTypeSelectItem value="text">
                        Text
                      </FieldTypeSelectItem>
                      <FieldTypeSelectItem value="number">
                        Number
                      </FieldTypeSelectItem>
                      <FieldTypeSelectItem value="date">
                        Date
                      </FieldTypeSelectItem>
                      <FieldTypeSelectItem value="boolean">
                        Boolean (Yes/No)
                      </FieldTypeSelectItem>
                      <FieldTypeSelectItem value="email">
                        Email
                      </FieldTypeSelectItem>
                      <FieldTypeSelectItem value="url">URL</FieldTypeSelectItem>
                      <FieldTypeSelectItem value="dropdown">
                        Dropdown
                      </FieldTypeSelectItem>
                      <FieldTypeSelectItem value="table">
                        Table
                      </FieldTypeSelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required-field"
                    checked={currentField.required}
                    onCheckedChange={(checked) =>
                      setCurrentField((prev) => ({
                        ...prev,
                        required: checked as boolean,
                      }))
                    }
                  />
                  <Label
                    htmlFor="required-field"
                    className="text-sm font-medium"
                  >
                    Required field
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Description
                </Label>
                <Input
                  value={currentField.description}
                  onChange={(e) =>
                    setCurrentField((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Additional context about this field..."
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  Optional field description
                </p>
              </div>

              {/* Dropdown Options */}
              {currentField.type === "dropdown" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <Label className="text-sm font-medium">Dropdown Options</Label>
                  </div>
                  <div className="space-y-3">
                    {currentField.options?.map(
                      (option: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2"
                        >
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [
                                ...(currentField.options || []),
                              ];
                              newOptions[index] = e.target.value;
                              setCurrentField((prev) => ({
                                ...prev,
                                options: newOptions,
                              }));
                            }}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 h-9"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newOptions =
                                currentField.options?.filter(
                                  (_: string, i: number) => i !== index
                                ) || [];
                              setCurrentField((prev) => ({
                                ...prev,
                                options: newOptions,
                              }));
                            }}
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentField((prev) => ({
                          ...prev,
                          options: [...(prev.options || []), ""],
                        }));
                      }}
                      className="w-full h-9 border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Table Columns Section */}
              {currentField.type === "table" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <Label className="text-sm font-medium">Table Columns</Label>
                  </div>

                  {/* Add Column Form */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background rounded-lg border">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Column Name
                      </Label>
                      <Input
                        value={currentTableColumn.name}
                        onChange={(e) =>
                          setCurrentTableColumn((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="amount"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Display Label
                      </Label>
                      <Input
                        value={currentTableColumn.label}
                        onChange={(e) =>
                          setCurrentTableColumn((prev) => ({
                            ...prev,
                            label: e.target.value,
                          }))
                        }
                        placeholder="Amount"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Type
                      </Label>
                      <Select
                        value={currentTableColumn.type}
                        onValueChange={(value) =>
                          setCurrentTableColumn((prev) => ({
                            ...prev,
                            type: value as TableColumn["type"],
                          }))
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <FieldTypeSelectItem value="text">
                            Text
                          </FieldTypeSelectItem>
                          <FieldTypeSelectItem value="number">
                            Number
                          </FieldTypeSelectItem>
                          <FieldTypeSelectItem value="date">
                            Date
                          </FieldTypeSelectItem>
                          <FieldTypeSelectItem value="boolean">
                            Boolean
                          </FieldTypeSelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={addTableColumn}
                    size="sm"
                    disabled={
                      !currentTableColumn.name || !currentTableColumn.label
                    }
                    className="h-9"
                  >
                    <Plus className="h-4 w-4" />
                    Add Column
                  </Button>

                  {/* Existing Columns */}
                  {currentField.tableColumns.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Defined Columns ({currentField.tableColumns.length})
                      </Label>
                      {currentField.tableColumns.map((column, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 bg-background rounded-md border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs font-medium text-muted-foreground">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-sm">
                                {column.label}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="text-xs text-muted-foreground font-mono">
                                  {column.name}
                                </code>
                                <Badge variant="secondary" className="text-xs">
                                  {column.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTableColumn(index)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentField({
                      name: "",
                      label: "",
                      type: "text",
                      required: false,
                      description: "",
                      options: [],
                      tableColumns: [],
                    });
                    setCurrentTableColumn({
                      name: "",
                      label: "",
                      type: "text",
                    });
                  }}
                  className="h-9"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Form
                </Button>
                <Button
                  onClick={addField}
                  disabled={!currentField.name || !currentField.label}
                  className="h-9"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {fields.length > 0 ? (
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Eye className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span>Defined Fields</span>
                  <Badge variant="secondary" className="ml-2">
                    {fields.length} field{fields.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <motion.div
                      key={field.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group p-4 border rounded-lg bg-card hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-medium text-sm text-muted-foreground">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-base">
                                {field.label}
                              </span>
                              {field.required && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs px-2 py-0.5"
                                >
                                  Required
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                                {field.name}
                              </code>
                              <Badge
                                variant="outline"
                                className="text-xs flex items-center gap-1"
                              >
                                {(() => {
                                  const IconComponent = getFieldTypeIcon(
                                    field.type
                                  );
                                  const typeLabels = {
                                    text: "Text",
                                    number: "Number",
                                    date: "Date",
                                    boolean: "Boolean",
                                    email: "Email",
                                    url: "URL",
                                    dropdown: "Dropdown",
                                    table: "Table",
                                  };
                                  return (
                                    <>
                                      <IconComponent className="h-3 w-3" />
                                      {typeLabels[field.type] || field.type}
                                    </>
                                  );
                                })()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeField(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {field.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {field.description}
                        </p>
                      )}

                      {/* Dropdown options display */}
                      {field.type === "dropdown" &&
                        field.options &&
                        field.options.length > 0 && (
                          <div className="mt-3 p-3 bg-secondary/30 rounded-lg border">
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                              Dropdown Options:
                            </Label>
                            <div className="flex flex-wrap gap-1">
                              {field.options.map(
                                (option: string, optIndex: number) => (
                                  <Badge
                                    key={optIndex}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {option}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Table columns display */}
                      {field.type === "table" &&
                        field.tableColumns.length > 0 && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                              Table Columns ({field.tableColumns.length}):
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {field.tableColumns.map((col, colIndex) => (
                                <div
                                  key={colIndex}
                                  className="flex items-center space-x-2 p-2 bg-background rounded border"
                                >
                                  <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {colIndex + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {col.label}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <code className="text-xs text-muted-foreground font-mono">
                                        {col.name}
                                      </code>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {col.type}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                  <Plus className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No fields defined yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Start by adding your first field using the form above
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const formTab = document.querySelector(
                      '[value="form"]'
                    ) as HTMLButtonElement;
                    if (formTab) formTab.click();
                  }}
                  className="text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Field
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
