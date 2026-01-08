/**
 * Execution Steps Tool UI Component.
 * Displays the timeline of execution steps from the agent.
 */
"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Check, Loader2, AlertCircle, Clock, Zap, Search, MessageSquare } from 'lucide-react';
import { ExecutionStep } from '@/types/chat';

interface StepsToolUIProps {
    steps: ExecutionStep[];
    isStreaming?: boolean;
}

export function StepsToolUI({ steps, isStreaming = false }: StepsToolUIProps) {
    if (!steps || steps.length === 0) {
        return null;
    }

    const getStepIcon = (type: string, isLast: boolean, streaming: boolean) => {
        const isRunning = isLast && streaming;

        if (isRunning) {
            return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
        }

        switch (type) {
            case 'search':
                return <Search className="h-3 w-3 text-blue-500" />;
            case 'generate':
                return <MessageSquare className="h-3 w-3 text-purple-500" />;
            case 'tool':
                return <Zap className="h-3 w-3 text-orange-500" />;
            case 'error':
                return <AlertCircle className="h-3 w-3 text-red-500" />;
            default:
                return <Check className="h-3 w-3 text-green-500" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-1 py-2"
        >
            {steps.map((step, index) => {
                const isLast = index === steps.length - 1;

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2 text-xs"
                    >
                        {/* Timeline dot/icon */}
                        <div className="relative flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                {getStepIcon(step.type, isLast, isStreaming)}
                            </div>
                            {/* Connecting line */}
                            {!isLast && (
                                <div className="absolute top-5 left-1/2 w-px h-3 -translate-x-1/2 bg-border" />
                            )}
                        </div>

                        {/* Step content */}
                        <span
                            className={`text-muted-foreground ${isLast && isStreaming ? 'text-foreground font-medium' : ''
                                }`}
                        >
                            {step.content}
                        </span>

                        {/* Timestamp (if available) */}
                        {step.timestamp && (
                            <span className="text-xs text-muted-foreground/60 ml-auto">
                                {new Date(step.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </span>
                        )}
                    </motion.div>
                );
            })}

            {/* Live indicator when streaming */}
            {isStreaming && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-xs text-blue-500 font-medium"
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-blue-500"
                    />
                    <span>Processing...</span>
                </motion.div>
            )}
        </motion.div>
    );
}
