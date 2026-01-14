"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    X,
    Maximize2,
    Minimize2,
    Download,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { apiService, DataLibraryEntry } from '@/services/api';
import { ExtractionEditor } from './extraction-editor';
import { toast } from 'sonner';
import { AuthorizedPdfViewer } from '@/components/authorized-pdf-viewer';


interface ExtractionViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    extractionId: number | null;
    onUpdate?: () => void; // Callback to refresh parent list
}

export function ExtractionViewerModal({
    isOpen,
    onClose,
    extractionId,
    onUpdate
}: ExtractionViewerModalProps) {
    const [extraction, setExtraction] = useState<DataLibraryEntry | null>(null);
    const [loading, setLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (isOpen && extractionId) {
            loadExtraction(extractionId);
        } else {
            setExtraction(null);
        }
    }, [isOpen, extractionId]);

    const loadExtraction = async (id: number) => {
        try {
            setLoading(true);
            const data = await apiService.getExtraction(id);
            setExtraction(data);
        } catch (error) {
            console.error('Error loading extraction:', error);
            toast.error('Failed to load extraction details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!extractionId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={`!max-w-[95vw] !max-h-[95vh] !w-[95vw] !h-[95vh] p-0 gap-0 overflow-hidden flex flex-col`}>
                <div className="flex items-center justify-between p-4 border-b bg-background z-50">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <DialogTitle className="text-lg font-semibold">
                                {extraction?.filename || 'Loading...'}
                            </DialogTitle>
                        </div>
                        {extraction && (
                            <Badge variant={extraction.status === 'APPROVED' ? "default" : "secondary"}>
                                {extraction.status === 'APPROVED' ? "Approved" : extraction.status?.replace('_', ' ') || 'Draft'}
                            </Badge>
                        )}
                        {extraction && (
                            <Badge variant="outline">
                                {extraction.schema_name} Schema
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: PDF Viewer */}
                    <div className="w-1/2 border-r bg-muted/20 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <AuthorizedPdfViewer
                                url={apiService.getPdfUrl(extractionId)}
                                title="PDF Viewer"
                            />
                        )}

                    </div>

                    {/* Right Panel: Data Editor */}
                    <div className="w-1/2 overflow-y-auto bg-background p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="space-y-4 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-muted-foreground">Loading extraction data...</p>
                                </div>
                            </div>
                        ) : extraction ? (
                            <ExtractionEditor
                                extractionId={extraction.id}
                                initialData={extraction.extracted_data}
                                fieldDefinitions={extraction.schema_definition?.field_definitions || []}
                                filename={extraction.filename}
                                onUpdate={(data) => {
                                    setExtraction(prev => prev ? ({ ...prev, extracted_data: data }) : null);
                                    onUpdate?.();
                                }}
                                onApprove={() => {
                                    setExtraction(prev => prev ? ({ ...prev, is_approved: true, status: 'APPROVED' }) : null);
                                    onUpdate?.();
                                    onClose();  // Close modal after approval
                                }}
                                onDelete={() => {
                                    onUpdate?.();
                                    onClose();
                                }}
                                isApproved={extraction.status === 'APPROVED'}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Failed to load data
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
