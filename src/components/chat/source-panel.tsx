import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    FileImage,
    Files,
    Activity,
    Search,
    Clock,
    MessageCircle,
    Zap,
    ExternalLink
} from 'lucide-react';
import { apiService, StreamEvent } from '@/services/api';
import { Message } from './types';

interface SourcePanelProps {
    message?: Message;
    isLoading?: boolean;
    onSourceClick: (source: any) => void;
}

export function SourcePanel({ message, isLoading, onSourceClick }: SourcePanelProps) {
    const [activeTab, setActiveTab] = useState<string>("sources");
    const [sourcesSubTab, setSourcesSubTab] = useState<'text' | 'images'>('text');

    // If no message is selected or message has no sources, show empty state or loading
    if (!message && !isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <Files className="h-8 w-8 mb-3 opacity-20" />
                <p className="text-sm">Select a message to view its sources and reasoning steps.</p>
            </div>
        );
    }

    const sources = message?.sources || [];
    const imageSources = message?.imageSources || [];
    const steps = message?.steps || [];

    // Helper for step icons
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'status': return <Clock className="h-3 w-3 text-blue-500" />;
            case 'RunResponseContent': return <MessageCircle className="h-3 w-3 text-green-500" />;
            case 'ToolCallStarted': return <Zap className="h-3 w-3 text-orange-500" />;
            case 'ToolCallCompleted': return <div className="h-3 w-3 rounded-full bg-green-500" />;
            case 'ReasoningStep': return <div className="h-3 w-3 rounded-full bg-purple-500" />;
            case 'sources': return <FileText className="h-3 w-3 text-blue-600" />;
            case 'error': return <div className="h-3 w-3 rounded-full bg-red-500" />;
            case 'complete': return <div className="h-3 w-3 rounded-full bg-green-500" />;
            default: return <div className="h-3 w-3 rounded-full bg-gray-400" />;
        }
    };

    return (
        <div className="h-full flex flex-col border-l bg-muted/10">
            <div className="px-4 py-3 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="sources">Sources</TabsTrigger>
                        <TabsTrigger value="steps">Reasoning</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {/* SOURCES TAB */}
                <Tabs value={activeTab} className="flex flex-col h-full min-h-0">
                    <TabsContent value="sources" className="flex-1 min-h-0 flex flex-col m-0 data-[state=inactive]:hidden">
                        <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/20">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Files className="h-3 w-3" />
                                Retrieved Content
                            </h3>
                            <div className="flex bg-background border rounded-md p-0.5">
                                <Button
                                    onClick={() => setSourcesSubTab('text')}
                                    variant="ghost"
                                    size="icon"
                                    className={`h-6 w-6 rounded-sm ${sourcesSubTab === 'text' ? 'bg-muted shadow-sm' : ''}`}
                                    title="Text Sources"
                                >
                                    <FileText className="h-3 w-3" />
                                </Button>
                                <Button
                                    onClick={() => setSourcesSubTab('images')}
                                    variant="ghost"
                                    size="icon"
                                    className={`h-6 w-6 rounded-sm ${sourcesSubTab === 'images' ? 'bg-muted shadow-sm' : ''}`}
                                    title="Image Sources"
                                >
                                    <FileImage className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Text Sources */}
                            {sourcesSubTab === 'text' && (
                                <div className="space-y-3">
                                    {sources.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground text-sm">
                                            <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            No text sources cited
                                        </div>
                                    ) : (
                                        sources.map((doc, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group bg-card border hover:border-primary/30 hover:shadow-md transition-all rounded-lg p-3 text-sm cursor-pointer"
                                                onClick={() => onSourceClick(doc)}
                                            >
                                                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="h-5 px-1.5 font-normal bg-muted/50">
                                                        {doc.document_index || index + 1}
                                                    </Badge>
                                                    <span className="truncate flex-1">{doc.metadata?.file_name || doc.filename}</span>
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="line-clamp-3 text-muted-foreground leading-relaxed text-xs">
                                                    {doc.content || doc.content_preview}
                                                </p>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Image Sources */}
                            {sourcesSubTab === 'images' && (
                                <div>
                                    {imageSources.filter(img => img.filename).length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground text-sm">
                                            <FileImage className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            No image sources used
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {imageSources.filter(img => img.filename).map((img, i) => (
                                                <div
                                                    key={i}
                                                    className="relative aspect-square bg-muted rounded-md border overflow-hidden cursor-pointer group hover:ring-2 ring-primary/20 transition-all"
                                                    onClick={() => {
                                                        // Create a normalized source object for the dialog
                                                        onSourceClick({
                                                            ...img,
                                                            type: 'image',
                                                            // Ensure we have a valid path for display
                                                            content: img.image_path || img.filename
                                                        });
                                                    }}
                                                >
                                                    <img
                                                        src={apiService.getImageUrl(img.image_path || img.filename || '')}
                                                        alt={img.filename}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    />
                                                    {/* Page Badge */}
                                                    {img.filename?.includes('_p') && (
                                                        <Badge className="absolute top-1 right-1 h-5 px-1.5 bg-black/60 backdrop-blur-sm border-none text-[10px] text-white">
                                                            P{img.filename.match(/_p(\d+)_/)?.[1] || '?'}
                                                        </Badge>
                                                    )}
                                                    {/* Filename Overlay */}
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-[10px] text-white truncate">
                                                            {img.metadata?.file_name || img.filename}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* STEPS TAB */}
                    <TabsContent value="steps" className="flex-1 min-h-0 flex flex-col m-0 data-[state=inactive]:hidden">
                        <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/20">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Activity className="h-3 w-3" />
                                Execution Steps
                            </h3>
                            <Badge variant="outline" className="h-5 text-[10px]">
                                {steps.length} Events
                            </Badge>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-0 relative border-l-2 border-muted ml-3 pl-8">
                                {steps.map((step: StreamEvent, i: number) => (
                                    <div key={i} className="mb-4 last:mb-0 relative">
                                        <div className="absolute -left-8 -translate-x-1/2 top-0 bg-background border-2 border-muted rounded-full w-6 h-6 flex items-center justify-center z-10">
                                            {getEventIcon(step.type)}
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium block mb-0.5">{step.type}</span>
                                            {typeof step.content === 'string' && (
                                                <p className="text-[10px] text-muted-foreground break-words bg-muted/30 p-2 rounded border font-mono">
                                                    {step.content.slice(0, 150)}{step.content.length > 150 ? '...' : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
