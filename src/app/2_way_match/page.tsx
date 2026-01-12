"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeftRight,
  FileText, 
  Download, 
  Play,
  AlertCircle,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  FileJson,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { apiService, ExtractionForMatching, TwoWayMatchResponse, MatchResult } from '@/services/api';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface DownloadOptionsProps {
  data: TwoWayMatchResponse;
  onDownload: (format: 'json' | 'csv' | 'excel') => void;
}

function DownloadOptions({ data, onDownload }: DownloadOptionsProps) {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onDownload('json')}
        className="flex items-center gap-2"
      >
        <FileJson className="h-4 w-4" />
        JSON
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onDownload('csv')}
        className="flex items-center gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        CSV
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onDownload('excel')}
        className="flex items-center gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </Button>
    </div>
  );
}

function ResultsTable({ results }: { results: MatchResult[] }) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Item</TableHead>
            <TableHead>Matched PO Item</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Reasoning</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="font-medium text-sm">
                  {result.item_in_inv}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {result.matched_item_in_po === "No Match Found" ? (
                    <span className="text-muted-foreground italic">No Match Found</span>
                  ) : (
                    result.matched_item_in_po
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`text-xs ${getConfidenceColor(result.confidence_score)}`}>
                  {result.confidence_score}%
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs text-muted-foreground max-w-xs">
                  {result.reasoning}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function TwoWayMatchPage() {
  const [extractions, setExtractions] = useState<ExtractionForMatching[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPO, setSelectedPO] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [results, setResults] = useState<TwoWayMatchResponse | null>(null);

  useEffect(() => {
    loadExtractions();
  }, []);

  const loadExtractions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExtractionsForMatching();
      setExtractions(response.extractions);
    } catch (error) {
      console.error('Error loading extractions:', error);
      toast.error('Failed to load extractions');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedPO || !selectedInvoice) {
      toast.error('Please select both a Purchase Order and an Invoice');
      return;
    }

    if (selectedPO === selectedInvoice) {
      toast.error('Please select different documents for PO and Invoice');
      return;
    }

    try {
      setProcessing(true);
      const response = await apiService.performTwoWayMatch(
        parseInt(selectedPO), 
        parseInt(selectedInvoice)
      );
      setResults(response);
      toast.success(`Matching completed! Found ${response.matched_items} matches out of ${response.total_invoice_items} items.`);
    } catch (error: any) {
      console.error('Error processing match:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to process two-way match';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = (format: 'json' | 'csv' | 'excel') => {
    if (!results) return;

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(results, null, 2);
          filename = `two_way_match_${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        
        case 'csv':
          const csvHeaders = 'Invoice Item,Matched PO Item,Confidence Score,Reasoning\n';
          const csvRows = results.match_results.map(result => 
            `"${result.item_in_inv}","${result.matched_item_in_po}",${result.confidence_score},"${result.reasoning}"`
          ).join('\n');
          content = csvHeaders + csvRows;
          filename = `two_way_match_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        
        case 'excel':
          // For Excel, we'll use CSV format with .xlsx extension
          // In a real implementation, you'd want to use a library like xlsx
          const excelHeaders = 'Invoice Item\tMatched PO Item\tConfidence Score\tReasoning\n';
          const excelRows = results.match_results.map(result => 
            `${result.item_in_inv}\t${result.matched_item_in_po}\t${result.confidence_score}\t${result.reasoning}`
          ).join('\n');
          content = excelHeaders + excelRows;
          filename = `two_way_match_${Date.now()}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        
        default:
          throw new Error('Unsupported format');
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${format.toUpperCase()} file successfully`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
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

  const selectedPOData = extractions.find(e => e.id.toString() === selectedPO);
  const selectedInvoiceData = extractions.find(e => e.id.toString() === selectedInvoice);

  if (loading) {
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
          <SiteHeader 
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#" className="dark:text-zinc-400 dark:hover:text-zinc-200">
                    Platform
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="dark:text-zinc-100">Two-Way Match</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading extractions...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
        <SiteHeader 
                  breadcrumb={
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                          <BreadcrumbLink href="#" className="dark:text-zinc-400 dark:hover:text-zinc-200">
                            Platform
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                        <BreadcrumbItem>
                          <BreadcrumbPage className="dark:text-zinc-100">Two-Way Match</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  }
                />
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
                    Two-Way Match
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                    className="text-muted-foreground"
                  >
                    Compare Purchase Orders with Invoices to identify matching line items
                  </motion.p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-6"
                >
                  {/* Document Selection */}
                  {!results ? (
                    /* Full Document Selection Card when no results */
                    <div className="max-w-4xl mx-auto">
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="text-center pb-6">
                          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-xl">Document Selection</CardTitle>
                          <CardDescription className="text-base max-w-md mx-auto">
                            Select one Purchase Order and one Invoice to compare their line items
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* PO Selection */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">1</span>
                                </div>
                                <label className="text-sm font-semibold">Select Purchase Order</label>
                              </div>
                              <Select value={selectedPO} onValueChange={setSelectedPO}>
                                <SelectTrigger className="h-12 bg-muted/30 border-2 hover:border-primary/20 transition-colors">
                                  <SelectValue placeholder="Choose a Purchase Order..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {extractions.filter(e => !selectedInvoice || e.id.toString() !== selectedInvoice).map((extraction) => (
                                    <SelectItem key={extraction.id} value={extraction.id.toString()}>
                                      <div className="flex items-center gap-3 w-full">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium truncate">{extraction.filename}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {extraction.schema_name} • {formatDate(extraction.created_at)}
                                          </div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedPOData && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800"
                                >
                                  <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                      <div className="font-medium text-blue-900 dark:text-blue-100">{selectedPOData.filename}</div>
                                      <div className="text-blue-700 dark:text-blue-300 text-xs">
                                        Schema: {selectedPOData.schema_name} • Created: {formatDate(selectedPOData.created_at)}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>

                            {/* VS Divider - Desktop */}
                            <div className="hidden lg:flex lg:items-center lg:justify-center lg:mt-8">
                              <div className="flex flex-col items-center gap-3 py-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">VS</span>
                              </div>
                            </div>

                            {/* Invoice Selection */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                  <span className="text-green-600 dark:text-green-400 font-semibold text-sm">2</span>
                                </div>
                                <label className="text-sm font-semibold">Select Invoice</label>
                              </div>
                              <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                                <SelectTrigger className="h-12 bg-muted/30 border-2 hover:border-primary/20 transition-colors">
                                  <SelectValue placeholder="Choose an Invoice..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {extractions.filter(e => !selectedPO || e.id.toString() !== selectedPO).map((extraction) => (
                                    <SelectItem key={extraction.id} value={extraction.id.toString()}>
                                      <div className="flex items-center gap-3 w-full">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium truncate">{extraction.filename}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {extraction.schema_name} • {formatDate(extraction.created_at)}
                                          </div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedInvoiceData && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800"
                                >
                                  <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                      <div className="font-medium text-green-900 dark:text-green-100">{selectedInvoiceData.filename}</div>
                                      <div className="text-green-700 dark:text-green-300 text-xs">
                                        Schema: {selectedInvoiceData.schema_name} • Created: {formatDate(selectedInvoiceData.created_at)}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Mobile VS indicator */}
                          <div className="lg:hidden flex items-center justify-center py-4">
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <div className="h-px bg-border flex-1"></div>
                              <div className="flex items-center gap-2">
                                <ArrowLeftRight className="h-4 w-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">VS</span>
                              </div>
                              <div className="h-px bg-border flex-1"></div>
                            </div>
                          </div>

                          {/* Process Button */}
                          <div className="flex justify-center pt-6 border-t">
                            <Button 
                              onClick={handleProcess}
                              disabled={!selectedPO || !selectedInvoice || processing || selectedPO === selectedInvoice}
                              size="lg"
                              className="min-w-48 h-12"
                            >
                              {processing ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Processing Match...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Process Match
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Validation Messages */}
                          {selectedPO && selectedInvoice && selectedPO === selectedInvoice && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 justify-center p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800"
                            >
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm">Please select different documents for comparison</span>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    /* Compact Document Selection Popover when results are shown */
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="font-medium">Selected Documents:</span>
                          <div className="text-muted-foreground">
                            PO: {selectedPOData?.filename} • Invoice: {selectedInvoiceData?.filename}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-2" />
                              Change Selection
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-6">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <h4 className="font-medium">Document Selection</h4>
                                <p className="text-sm text-muted-foreground">
                                  Change the selected documents for comparison
                                </p>
                              </div>
                              
                              <div className="space-y-4">
                                {/* PO Selection in Popover */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Purchase Order</label>
                                  <Select value={selectedPO} onValueChange={setSelectedPO}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a Purchase Order" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {extractions.map((extraction) => (
                                        <SelectItem key={extraction.id} value={extraction.id.toString()}>
                                          <div className="flex items-center justify-between w-full">
                                            <span className="truncate">{extraction.filename}</span>
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              {extraction.schema_name}
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Invoice Selection in Popover */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Invoice</label>
                                  <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an Invoice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {extractions.map((extraction) => (
                                        <SelectItem key={extraction.id} value={extraction.id.toString()}>
                                          <div className="flex items-center justify-between w-full">
                                            <span className="truncate">{extraction.filename}</span>
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              {extraction.schema_name}
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Process Button in Popover */}
                                <div className="pt-2">
                                  <Button 
                                    onClick={handleProcess}
                                    disabled={!selectedPO || !selectedInvoice || processing || selectedPO === selectedInvoice}
                                    className="w-full"
                                    size="sm"
                                  >
                                    {processing ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Reprocess Match
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {results && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Summary */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              Match Results
                            </CardTitle>
                            <DownloadOptions data={results} onDownload={handleDownload} />
                          </div>
                          <CardDescription>
                            Comparison between {results.po_filename} and {results.invoice_filename}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                              <div className="text-2xl font-bold text-primary">{results.total_invoice_items}</div>
                              <div className="text-sm text-muted-foreground">Total Items</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{results.matched_items}</div>
                              <div className="text-sm text-muted-foreground">Matched</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">{results.unmatched_items}</div>
                              <div className="text-sm text-muted-foreground">Unmatched</div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {Math.round((results.matched_items / results.total_invoice_items) * 100)}%
                              </div>
                              <div className="text-sm text-muted-foreground">Match Rate</div>
                            </div>
                          </div>

                          {results.processing_time && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                              <Clock className="h-4 w-4" />
                              Processing time: {results.processing_time.toFixed(2)} seconds
                            </div>
                          )}

                          <ResultsTable results={results.match_results} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Empty State */}
                  {extractions.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No Approved Extractions Found</p>
                        <p className="text-muted-foreground">
                          You need approved extractions from the Data Library to perform two-way matching.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
