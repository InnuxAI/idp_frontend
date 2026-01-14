"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Download, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';

interface ImageSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    source: any;
}

export function ImageSourceModal({ isOpen, onClose, source }: ImageSourceModalProps) {
    if (!source) return null;

    // Resolve image path - prefer image_path, then content, then filename
    const imagePath = source.image_path || source.content || source.filename || '';

    // Always use apiService.getImageUrl unless it's already a full URL
    const imageUrl = imagePath.startsWith('http')
        ? imagePath
        : apiService.getImageUrl(imagePath);

    const filename = source.metadata?.file_name || source.filename || 'Image Source';
    const pageNumber = source.filename?.match(/_p(\d+)_/)?.[1];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: 0,
                            transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                                mass: 0.5
                            }
                        }}
                        exit={{
                            scale: 0.95,
                            opacity: 0,
                            y: 10,
                            transition: { duration: 0.2 }
                        }}
                        className="relative bg-card border shadow-2xl rounded-xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                                    <FileImage className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-medium text-sm truncate">{filename}</h3>
                                    {pageNumber && (
                                        <p className="text-xs text-muted-foreground">Page {pageNumber}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                    title="Open in new tab"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Image Container */}
                        <div className="flex-1 overflow-auto p-2 bg-muted/10 flex items-center justify-center min-h-[300px]">
                            {imageUrl ? (
                                <motion.img
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    src={imageUrl}
                                    alt={filename}
                                    className="max-w-full max-h-[calc(90vh-100px)] object-contain rounded-md shadow-sm"
                                />
                            ) : (
                                <div className="text-muted-foreground flex flex-col items-center gap-2">
                                    <FileImage className="h-12 w-12 opacity-20" />
                                    <span>Image not available</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
