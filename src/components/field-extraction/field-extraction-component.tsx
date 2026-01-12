"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  Settings,
  Eye,
  Download,
  Plus,
  X,
  Save,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Mail,
  Link,
  ChevronDown,
  Table,
  CheckSquare,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SurveyCreator } from "@/components/field-extraction/survey-creator";
import { FileUploadZone } from "@/components/field-extraction/file-upload-zone";
import { ExtractionResults } from "@/components/field-extraction/extraction-results";
import { FieldDefinitionPreview } from "@/components/field-extraction/field-definition-preview";
import { apiService } from "@/services/api";
import { ExtractionEditor } from "@/components/field-extraction/extraction-editor";
import { DataLibraryComponent } from "@/components/field-extraction/data-library-component";
import { SchemaSelector } from "@/components/field-extraction/schema-selector";

export interface FieldDefinition {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'dropdown' | 'table';
  label: string;
  required?: boolean;
  options?: string[]; // For dropdown type
  description?: string;
  tableColumns?: TableColumn[]; // For table type
}

export interface TableColumn {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

export interface ExtractionResult {
  [fieldName: string]: any;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  results?: ExtractionResult;
  extractionId?: number; // Add extraction ID from backend
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function FieldExtractionComponent() {
  const [activeTab, setActiveTab] = useState<'define' | 'upload' | 'results' | 'library'>('define');
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | undefined>();
  const [selectedSchemaName, setSelectedSchemaName] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [surveyJson, setSurveyJson] = useState<any>(null);
  const [currentSchemaId, setCurrentSchemaId] = useState<number | null>(null); // Add schema ID state

  // Save schema dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [schemaName, setSchemaName] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldDefinitionsChange = (definitions: FieldDefinition[]) => {
    setFieldDefinitions(definitions);
    console.log('Field definitions updated:', definitions);
  };

  const handleSurveyChange = (survey: any) => {
    setSurveyJson(survey);
    // Convert survey questions to field definitions
    if (survey?.pages?.[0]?.elements) {
      const definitions: FieldDefinition[] = survey.pages[0].elements.map((element: any) => ({
        name: element.name,
        type: mapSurveyTypeToFieldType(element.type),
        label: element.title || element.name,
        required: element.isRequired || false,
        options: element.choices?.map((choice: any) =>
          typeof choice === 'string' ? choice : choice.value || choice.text
        ),
        description: element.description
      }));
      setFieldDefinitions(definitions);
    }
  };

  const mapSurveyTypeToFieldType = (surveyType: string): FieldDefinition['type'] => {
    switch (surveyType) {
      case 'text':
      case 'comment':
        return 'text';
      case 'dropdown':
      case 'checkbox':
      case 'radiogroup':
        return 'dropdown';
      case 'boolean':
        return 'boolean';
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      default:
        return 'text';
    }
  };

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

  const handleFileUpload = async (files: File[]) => {
    if (fieldDefinitions.length === 0) {
      toast.error('Please define field extraction schema first or select an existing schema');
      return;
    }

    // Use selected schema ID if available, otherwise use current schema ID (from define tab)
    const schemaToUse = selectedSchemaId || currentSchemaId;

    if (!schemaToUse) {
      toast.error('Please save the schema first or select an existing schema before uploading files');
      return;
    }

    setIsProcessing(true);

    for (const file of files) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newFile: UploadedFile = {
        file,
        id: fileId,
        progress: 0,
        status: 'uploading'
      };

      setUploadedFiles(prev => [...prev, newFile]);

      try {
        // Update progress to show upload started
        setUploadedFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, progress: 20 } : f)
        );

        // Call real API for field extraction
        const extractionResponse = await apiService.extractFieldsFromPdf(file, schemaToUse);

        // Update progress
        setUploadedFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, progress: 100 } : f)
        );

        // Update with results
        setUploadedFiles(prev =>
          prev.map(f => f.id === fileId ? {
            ...f,
            status: 'completed',
            results: extractionResponse.extracted_data,
            extractionId: extractionResponse.extraction_id
          } : f)
        );

      } catch (error) {
        console.error('File processing error:', error);
        setUploadedFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, status: 'error' } : f)
        );

        // Show error to user
        toast.error(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setIsProcessing(false);
    setActiveTab('results');
  };

  const processFileWithFields = async (file: File, fields: FieldDefinition[]): Promise<ExtractionResult> => {
    // Mock implementation - in real scenario, this would call the backend API
    // with the file and field definitions

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock extracted data based on field definitions
    const mockResults: ExtractionResult = {};

    fields.forEach(field => {
      switch (field.type) {
        case 'text':
          mockResults[field.name] = `Sample ${field.label}`;
          break;
        case 'number':
          mockResults[field.name] = Math.floor(Math.random() * 1000);
          break;
        case 'date':
          mockResults[field.name] = new Date().toISOString().split('T')[0];
          break;
        case 'boolean':
          mockResults[field.name] = Math.random() > 0.5;
          break;
        case 'email':
          mockResults[field.name] = 'example@domain.com';
          break;
        case 'dropdown':
          if (field.options && field.options.length > 0) {
            mockResults[field.name] = field.options[0];
          }
          break;
        case 'table':
          // Generate mock table data
          if (field.tableColumns && field.tableColumns.length > 0) {
            mockResults[field.name] = Array.from({ length: 3 }, (_, i) => {
              const row: any = {};
              field.tableColumns!.forEach(col => {
                switch (col.type) {
                  case 'text':
                    row[col.name] = `Row ${i + 1} ${col.label}`;
                    break;
                  case 'number':
                    row[col.name] = Math.floor(Math.random() * 100);
                    break;
                  case 'date':
                    row[col.name] = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                  case 'boolean':
                    row[col.name] = Math.random() > 0.5;
                    break;
                }
              });
              return row;
            });
          } else {
            mockResults[field.name] = [];
          }
          break;
        default:
          mockResults[field.name] = `Mock value for ${field.label}`;
      }
    });

    return mockResults;
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSaveSchema = async () => {
    if (!schemaName.trim() || fieldDefinitions.length === 0) {
      toast.error('Please provide a schema name and ensure you have field definitions');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/schemas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: schemaName.trim(),
          description: schemaDescription.trim() || null,
          field_definitions: fieldDefinitions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save schema');
      }

      const savedSchema = await response.json();
      console.log('Schema saved successfully:', savedSchema);

      // Set the current schema ID so we can use it for extractions
      setCurrentSchemaId(savedSchema.id);

      // Reset dialog state
      setSchemaName('');
      setSchemaDescription('');
      setShowSaveDialog(false);

      // Show success message
      toast.success('Schema saved successfully! You can now upload files for extraction.');

    } catch (error) {
      console.error('Error saving schema:', error);
      toast.error(`Error saving schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const canProceedToUpload = fieldDefinitions.length > 0;
  const hasResults = uploadedFiles.some(f => f.status === 'completed');

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {/* Header & Stepper Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-border/40">
        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-serif font-medium tracking-tight text-foreground"
          >
            Field Extraction
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl"
          >
            Define fields, upload documents, and extract structured data with precision.
          </motion.p>
        </div>

        {/* Integrated Stepper */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-1 bg-zinc-200 dark:bg-zinc-800 p-1.5 rounded-full border border-border self-start xl:self-auto"
        >
          {[
            { id: 'define', icon: Settings, label: 'Define' },
            { id: 'upload', icon: Upload, label: 'Upload' },
            { id: 'results', icon: Eye, label: 'Results' },
            { id: 'library', icon: Database, label: 'Library' }
          ].map((step) => {
            const isActive = activeTab === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id as any)}
                className={`
                    relative flex items-center space-x-2 px-5 py-2.5 rounded-full transition-all duration-500 ease-out shadow-sm shadow-border dark:shadow-sm dark:shadow-border
                    ${isActive ? 'text-primary-foreground' : 'text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground dark:hover:bg-zinc-700'}
                  `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <div className="relative z-10 flex items-center space-x-2">
                  <step.icon className="h-4 w-4" />
                  <span className={`text-sm font-medium  ${isActive ? 'font-semibold' : ''}`}>{step.label}</span>
                </div>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="w-full min-h-[500px]"
        >
          {activeTab === 'define' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Definition Area */}
                <div className="lg:col-span-2">
                  <Card className="border border-border/60 bg-muted/20 dark:bg-muted/30">
                    <CardContent className="p-6 pt-0">
                      <SurveyCreator
                        onSurveyChange={handleSurveyChange}
                        onFieldDefinitionsChange={handleFieldDefinitionsChange}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar with Preview */}
                <div className="space-y-6">
                  {fieldDefinitions.length > 0 ? (
                    <>
                      <Card className="border border-border/60 overflow-hidden bg-background">
                        <div className="h-1 bg-primary w-full" />
                        <CardHeader className="pb-3 bg-muted/25 dark:bg-muted/35">
                          <CardTitle className="flex items-center justify-between text-lg font-semibold tracking-tight">
                            <div className="flex items-center gap-2">
                              <span>Field Summary</span>
                              {fieldDefinitions.filter(f => f.required).length > 0 && (
                                <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 h-5">
                                  {fieldDefinitions.filter(f => f.required).length} Required
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary">
                              {fieldDefinitions.length} fields
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {fieldDefinitions.map((field, idx) => {
                              const IconComponent = getFieldTypeIcon(field.type);
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                                  <span className="text-sm font-medium truncate max-w-[140px]" title={field.label}>
                                    {field.label}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] font-normal gap-1 px-1.5 bg-background">
                                    <IconComponent className="h-3 w-3 text-muted-foreground" />
                                    <span className="capitalize">{field.type}</span>
                                  </Badge>
                                </div>
                              );
                            })}
                            {fieldDefinitions.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                No fields added yet.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Save Schema Button */}
                      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                        <DialogTrigger asChild>
                          <Button variant="default" className="w-full " size="lg">
                            <Save className="h-4 w-4 mr-2" />
                            Save Schema
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="font-semibold text-xl tracking-tight">Save Extraction Schema</DialogTitle>
                            <DialogDescription className="">
                              Save your field definitions as a reusable extraction schema.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="schema-name" className="">Schema Name *</Label>
                              <Input
                                id="schema-name"
                                placeholder="Enter schema name"
                                value={schemaName}
                                onChange={(e) => setSchemaName(e.target.value)}
                                disabled={isSaving}
                                className=""
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="schema-description" className="">Description (Optional)</Label>
                              <Textarea
                                id="schema-description"
                                placeholder="Enter schema description"
                                value={schemaDescription}
                                onChange={(e) => setSchemaDescription(e.target.value)}
                                disabled={isSaving}
                                rows={3}
                                className=" resize-none"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="ghost"
                              onClick={() => setShowSaveDialog(false)}
                              disabled={isSaving}
                              className=""
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveSchema}
                              disabled={!schemaName.trim() || isSaving}
                              className=""
                            >
                              {isSaving ? 'Saving...' : 'Save Schema'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={() => setActiveTab('upload')}
                        className="w-full "
                        variant="secondary"
                        size="lg"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Proceed to Upload
                      </Button>
                    </>
                  ) : (
                    <Card className="border-dashed border-2 border-muted hover:border-muted-foreground/30 transition-colors bg-transparent shadow-none">
                      <CardContent className="p-8 text-center space-y-4">
                        <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                          <Settings className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium text-foreground ">No Fields Defined</h3>
                          <p className="text-muted-foreground text-sm ">
                            Start adding fields to see the summary here.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="max-w-full mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                {/* Left Column: Schema Selector */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                  <SchemaSelector
                    onSchemaSelect={(schema) => {
                      setSelectedSchemaId(schema.id);
                      setSelectedSchemaName(schema.name);
                      setFieldDefinitions(schema.fields);
                    }}
                    selectedSchemaId={selectedSchemaId}
                  />
                </div>

                {/* Right Column: File Upload */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                  <div className="space-y-6">
                    <div className={!selectedSchemaId ? "opacity-60 pointer-events-none grayscale" : ""}>
                      <FileUploadZone
                        onFilesSelected={handleFileUpload}
                        disabled={isProcessing || !selectedSchemaId}
                        acceptedTypes={".pdf,.doc,.docx,.txt"}
                      />
                    </div>

                    {!selectedSchemaId && (
                      <div className="text-center p-4">
                        <p className="text-muted-foreground  flex items-center justify-center gap-2">
                          <ChevronDown className="h-4 w-4 animate-bounce" />
                          Please select a schema from the left to unlock upload
                        </p>
                      </div>
                    )}

                    {uploadedFiles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4 pt-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold tracking-tight">Processing Queue</h3>
                          <Badge variant="outline" className="">
                            {uploadedFiles.length} files
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {uploadedFiles.map((file) => (
                            <Card key={file.id} className="overflow-hidden border shadow-sm">
                              <div className="flex items-center p-3 gap-4">
                                <div className={`p-2 rounded-lg ${file.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                  {file.status === 'completed' ? <CheckSquare className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate  text-sm">{file.file.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Progress value={file.progress} className="h-1.5 w-24" />
                                    <span className="text-xs text-muted-foreground capitalize ">{file.status}</span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(file.id)} className="h-8 w-8">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>

                        {uploadedFiles.some(f => f.status === 'completed') && (
                          <div className="flex justify-start pt-4">
                            <Button
                              onClick={() => setActiveTab('results')}
                              size="lg"
                              className=""
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Results
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="max-w-7xl mx-auto space-y-8">
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center justify-between text-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Eye className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span>Extraction Results</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {uploadedFiles.filter(f => f.status === 'completed').length} files processed
                      </Badge>
                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Export All</span>
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Review and download the extracted field data from your documents.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 py-0">
                  <div className="space-y-6">
                    {uploadedFiles
                      .filter(f => f.status === 'completed' && f.extractionId && f.results)
                      .map((file) => (
                        <ExtractionEditor
                          key={file.id}
                          extractionId={file.extractionId!}
                          initialData={file.results!}
                          fieldDefinitions={fieldDefinitions}
                          filename={file.file.name}
                          onUpdate={(updatedData) => {
                            // Update the local state with new data
                            setUploadedFiles(prev =>
                              prev.map(f =>
                                f.id === file.id
                                  ? { ...f, results: updatedData }
                                  : f
                              )
                            );
                          }}
                          onApprove={() => {
                            // Mark as approved and move to data library view
                            console.log('Extraction approved for:', file.file.name);
                            // Show a toast notification
                            // Switch to data library tab to show the saved extraction
                            setTimeout(() => setActiveTab('library'), 1000);
                          }}
                          onDelete={() => {
                            // Remove from uploaded files list
                            setUploadedFiles(prev =>
                              prev.filter(f => f.id !== file.id)
                            );
                          }}
                        />
                      ))
                    }

                    {uploadedFiles.filter(f => f.status === 'completed').length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No completed extractions to display.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="w-full">
              <DataLibraryComponent />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Helper Components
interface StepIndicatorProps {
  step: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function StepIndicator({ step, title, isActive, isCompleted, disabled, onClick }: StepIndicatorProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-muted cursor-pointer'
        }`}
    >
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
        ${isCompleted
          ? 'bg-primary text-primary-foreground'
          : isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }
      `}>
        {isCompleted ? '✓' : step}
      </div>
      <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'
        }`}>
        {title}
      </span>
    </button>
  );
}

interface FileUploadItemProps {
  file: UploadedFile;
  onRemove: () => void;
}

function FileUploadItem({ file, onRemove }: FileUploadItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
      <div className="flex items-center space-x-3 flex-1">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.file.name}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={
              file.status === 'completed' ? 'default' :
                file.status === 'error' ? 'destructive' : 'secondary'
            }>
              {file.status}
            </Badge>
            {file.status === 'uploading' && (
              <Progress value={file.progress} className="w-20" />
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
