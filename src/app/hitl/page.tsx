"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { hitlService, ProcessResponse } from "@/services/hitl-service";
import {
    IconUpload,
    IconPlayerPlay,
    IconCheck,
    IconX,
    IconAlertTriangle,
    IconBrain,
    IconFileInvoice,
    IconReceipt,
    IconTerminal2,
    IconSatellite,
} from "@tabler/icons-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { motion } from "framer-motion";

interface LogEntry {
    msg: string;
    type: "info" | "success" | "warning" | "brain";
    time: string;
}

interface TaskInfo {
    vendor: string;
    part_id: string;
    amount: number;
    po_amount: number;
    variance_pct: number;
    line_item_mismatch?: boolean;
    mismatches?: Array<{
        invoice_item: string;
        po_item: string;
        issue: string;
    }>;
    state?: Record<string, unknown>;
}

export default function HITLPage() {
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [poFile, setPoFile] = useState<File | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [task, setTask] = useState<TaskInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [reviewerComment, setReviewerComment] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const addLog = (
        msg: string,
        type: "info" | "success" | "warning" | "brain" = "info"
    ) => {
        setLogs((prev) => [
            ...prev,
            {
                msg,
                type,
                time: new Date().toLocaleTimeString([], {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }),
            },
        ]);
    };

    const runAnalysis = async () => {
        if (!invoiceFile || !poFile) {
            addLog("Error: Upload both documents.", "warning");
            return;
        }

        setLoading(true);
        setLogs([]);
        setTask(null);
        setReviewerComment("");

        try {
            addLog("Initializing Gemini Vision...", "info");

            // Extract invoice data
            const invoiceFormData = new FormData();
            invoiceFormData.append("file", invoiceFile);
            const invoiceExtracted = await hitlService.extractInvoice(invoiceFormData);
            addLog(
                `Invoice extracted. Vendor: ${invoiceExtracted.vendor_name || "Unknown"}`,
                "success"
            );

            // Extract PO data
            const poFormData = new FormData();
            poFormData.append("file", poFile);
            const poExtracted = await hitlService.extractInvoice(poFormData);
            addLog(`PO extracted. Total: $${poExtracted.total_amount || 0}`, "success");

            // Process invoice through workflow
            const processPayload = {
                vendor: invoiceExtracted.vendor_name || "Unknown Vendor",
                part_id:
                    invoiceExtracted.part_id ||
                    invoiceExtracted.po_number ||
                    "N/A",
                invoice_total: invoiceExtracted.total_amount || 0,
                po_total: poExtracted.total_amount || 0,
                invoice_line_items: invoiceExtracted.line_items || [],
                po_line_items: poExtracted.line_items || [],
            };

            addLog(
                `Processing: Invoice $${processPayload.invoice_total} vs PO $${processPayload.po_total}`,
                "info"
            );

            if ((processPayload.invoice_line_items?.length || 0) > 0) {
                addLog(
                    `Comparing ${processPayload.invoice_line_items?.length} invoice items against ${processPayload.po_line_items?.length} PO items`,
                    "info"
                );
            }

            const response: ProcessResponse = await hitlService.processInvoice(
                processPayload
            );

            if (response.action_required) {
                if (response.line_item_mismatch) {
                    addLog("⚠️ LINE ITEM MISMATCH DETECTED!", "warning");
                    if (response.mismatches && response.mismatches.length > 0) {
                        response.mismatches.forEach((m) => {
                            addLog(
                                `  • Invoice: "${m.invoice_item}" vs PO: "${m.po_item}" - ${m.issue}`,
                                "warning"
                            );
                        });
                    }
                    if (response.comment) {
                        addLog(response.comment, "warning");
                    }
                } else {
                    addLog(
                        `Variance: ${response.variance}%. Policy Violation - Human Review Required.`,
                        "warning"
                    );
                }

                setTask({
                    vendor: response.vendor || processPayload.vendor,
                    part_id: response.part_id || processPayload.part_id,
                    amount: response.invoice_total || processPayload.invoice_total,
                    po_amount: response.po_total || processPayload.po_total,
                    variance_pct: response.variance,
                    line_item_mismatch: response.line_item_mismatch,
                    mismatches: response.mismatches,
                    state: response.state,
                });
            } else {
                const decisionSource =
                    response.decision === "approved_via_memory" ? "Memory" : "Policy";
                addLog(`Status: APPROVED via ${decisionSource}`, "success");
                if (response.comment) {
                    addLog(`Reasoning: ${response.comment}`, "info");
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            addLog(`Error: ${errorMessage}`, "warning");
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (decision: "approved" | "rejected") => {
        if (!task) return;

        try {
            addLog(`Submitting human ${decision} decision...`, "info");

            const resumePayload = {
                approved: decision === "approved",
                comment: reviewerComment || "",
                state: task.state
                    ? {
                        ...task.state,
                        line_item_mismatch: task.line_item_mismatch || false,
                        mismatches: task.mismatches || [],
                    }
                    : {
                        vendor: task.vendor,
                        part_id: task.part_id,
                        variance_pct: task.variance_pct,
                        line_item_mismatch: task.line_item_mismatch || false,
                        mismatches: task.mismatches || [],
                    },
            };

            await hitlService.resumeProcess(resumePayload);

            addLog(`🧠 Reviewer Note: ${reviewerComment || "No comment"}`, "brain");
            addLog("Process Finalized. Memory Updated.", "success");
            setTask(null);
            setReviewerComment("");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            addLog(`Error: ${errorMessage}`, "warning");
        }
    };

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
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="#" className="dark:text-zinc-400 dark:hover:text-zinc-200">
                                            Platform
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                                    <BreadcrumbSeparator className="hidden md:block dark:text-zinc-600" />
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="dark:text-zinc-100">Human In The Loop</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </motion.div>
                            </BreadcrumbList>
                        </Breadcrumb>
                    }
                />
                <div className="flex flex-1 flex-col gap-8 p-8 bg-background/95 min-h-screen font-sans">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b pb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-sm">
                                <IconBrain className="h-8 w-8 text-orange-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Agentic Invoice Console
                                </h1>
                                <p className="text-muted-foreground text-base mt-1">
                                    AI-powered invoice approval with human oversight
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={runAnalysis}
                            disabled={loading || !invoiceFile || !poFile}
                            size="lg"
                            className="gap-2 h-12 px-6 text-base shadow-md transition-all hover:shadow-lg bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> Processing...
                                </>
                            ) : (
                                <>
                                    <IconPlayerPlay className="h-5 w-5 fill-current" />
                                    Run Agentic Analysis
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column - Document Intake & Terminal */}
                        <div className="lg:col-span-5 flex flex-col gap-8">
                            {/* Document Intake */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="border border-border rounded-xl shadow-sm overflow-hidden"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-border">
                                    <IconUpload className="h-4 w-4 text-orange-500" />
                                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                        Document Intake
                                    </span>
                                </div>
                                {/* Content */}
                                <div className="p-4 space-y-4 bg-card">
                                    {/* Invoice Upload */}
                                    <div className="group relative">
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                            Invoice File
                                        </label>
                                        <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-xl p-1 pr-4 transition-colors group-hover:border-orange-500/50 bg-muted/5">
                                            <input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={(e) =>
                                                    setInvoiceFile(e.target.files?.[0] || null)
                                                }
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                    <IconFileInvoice className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    {invoiceFile ? (
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                {invoiceFile.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {(invoiceFile.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            Click to upload invoice (PDF, IMG)
                                                        </p>
                                                    )}
                                                </div>
                                                {invoiceFile && <IconCheck className="h-5 w-5 text-emerald-500" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* PO Upload */}
                                    <div className="group relative">
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                            Purchase Order File
                                        </label>
                                        <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-xl p-1 pr-4 transition-colors group-hover:border-orange-500/50 bg-muted/5">
                                            <input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={(e) => setPoFile(e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    <IconReceipt className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    {poFile ? (
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                {poFile.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {(poFile.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            Click to upload PO (PDF, IMG)
                                                        </p>
                                                    )}
                                                </div>
                                                {poFile && <IconCheck className="h-5 w-5 text-emerald-500" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Agent Terminal */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="flex-1 flex flex-col border border-border rounded-xl shadow-sm overflow-hidden min-h-0"
                            >
                                {/* Terminal Header */}
                                <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-border">
                                    <IconTerminal2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                                        Agent.log
                                    </span>
                                </div>
                                {/* Terminal Content */}
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto font-mono text-xs space-y-1 p-3 bg-neutral-50 dark:bg-neutral-950 min-h-[120px]"
                                >
                                    {logs.length === 0 ? (
                                        <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                                            <IconTerminal2 className="h-8 w-8 opacity-50" />
                                            <p className="italic">Waiting for agent execution...</p>
                                        </div>
                                    ) : (
                                        logs.map((l, i) => (
                                            <div
                                                key={i}
                                                className={`flex gap-3 py-0.5 ${l.type === "warning"
                                                    ? "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30 py-1 rounded"
                                                    : l.type === "success"
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : l.type === "brain"
                                                            ? "text-blue-600 dark:text-blue-400 font-semibold"
                                                            : "text-neutral-700 dark:text-neutral-300"
                                                    }`}
                                            >
                                                <span className="opacity-50 select-none w-14 shrink-0 text-right text-neutral-500">
                                                    {l.time.split(' ')[0]}
                                                </span>
                                                <span className="break-words flex-1">
                                                    {l.type === "brain" && "🧠 "}
                                                    {l.msg}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column - Review Panel */}
                        <div className="lg:col-span-7">
                            {task ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.15 }}
                                    className="border border-border rounded-xl shadow-lg overflow-hidden h-full flex flex-col"
                                >
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 text-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-orange-100 text-sm font-medium uppercase tracking-wider mb-1">Authorization Request</p>
                                                <h2 className="text-3xl font-bold tracking-tight">{task.vendor}</h2>
                                                <p className="text-orange-50 opacity-90 mt-1">Part ID: {task.part_id}</p>
                                            </div>
                                            <Badge variant="outline" className="bg-white/20 text-white border-white/40 backdrop-blur-md px-3 py-1 font-mono">
                                                {new Date().toLocaleDateString()}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 space-y-5 flex-1 bg-card">
                                        {/* Line Item Mismatch Alert */}
                                        {task.line_item_mismatch && (
                                            <div className="bg-destructive/5 dark:bg-destructive/10 border-l-4 border-destructive rounded-r-lg p-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 bg-destructive/10 rounded-full shrink-0">
                                                        <IconAlertTriangle className="h-6 w-6 text-destructive" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-destructive font-bold text-lg mb-2">
                                                            Line Item Mismatch Detected
                                                        </h3>
                                                        {task.mismatches && task.mismatches.length > 0 && (
                                                            <div className="space-y-3 mt-3">
                                                                {task.mismatches.map((m, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="bg-background rounded-lg border p-4 shadow-sm"
                                                                    >
                                                                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                                                            <div>
                                                                                <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">Invoice Item</span>
                                                                                <p className="font-medium text-destructive">{m.invoice_item}</p>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">PO Expectation</span>
                                                                                <p className="font-medium text-emerald-600 dark:text-emerald-400">{m.po_item}</p>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-xs font-semibold text-muted-foreground border-t pt-2 mt-2 flex items-center gap-1">
                                                                            ⚡ Issue: {m.issue}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Financials */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border">
                                                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Invoice Amount</p>
                                                <p className="text-2xl font-bold tracking-tight">${task.amount.toLocaleString()}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border">
                                                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">PO Authorized</p>
                                                <p className="text-2xl font-bold tracking-tight">${task.po_amount.toLocaleString()}</p>
                                            </div>
                                            {/* Variance Card */}
                                            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                                                <p className="text-xs uppercase font-bold mb-1">Variance</p>
                                                <p className="text-3xl font-black tracking-tighter">
                                                    {task.variance_pct}%
                                                </p>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Review Decision */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                Reviewer Assessment
                                            </label>
                                            <Textarea
                                                value={reviewerComment}
                                                onChange={(e) => setReviewerComment(e.target.value)}
                                                placeholder="Provide reasoning for your decision (e.g., 'Authorized shipping overage per agreement'). This will be saved to memory."
                                                className="min-h-[100px] resize-none text-base p-4 rounded-xl border-muted-foreground/20 focus:border-orange-500 transition-colors"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Button
                                                onClick={() => handleDecision("approved")}
                                                className="h-12 text-base font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all"
                                                size="lg"
                                            >
                                                <IconCheck className="h-5 w-5 stroke-[3]" />
                                                Approve Exception
                                            </Button>
                                            <Button
                                                onClick={() => handleDecision("rejected")}
                                                variant="destructive"
                                                className="h-12 text-base font-semibold gap-2 shadow-lg transition-all"
                                                size="lg"
                                            >
                                                <IconX className="h-5 w-5 stroke-[3]" />
                                                Reject Invoice
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.15 }}
                                    className="h-full min-h-[400px] rounded-xl border-2 border-dashed border-muted-foreground/15 bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center text-center p-12 gap-6"
                                >
                                    <div className="p-6 rounded-full bg-neutral-100 dark:bg-neutral-900">
                                        <div className="text-4xl"><IconSatellite /></div>
                                    </div>
                                    <div className="max-w-sm space-y-2">
                                        <h3 className="text-xl font-semibold text-foreground">Ready for Analysis</h3>
                                        <p className="text-muted-foreground">
                                            Upload an invoice and purchase order to begin the AI matching process. Exceptions will appear here for review.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
