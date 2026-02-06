"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { IconKey, IconCopy, IconEye, IconEyeOff, IconPlus, IconTrash, IconHistory, IconCode, IconCheck, IconAlertTriangle } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ApiKey {
    id: string
    name: string
    prefix: string
    createdAt: string
    lastUsed: string | null
    status: 'active' | 'revoked'
}

export default function ApiKeysPage() {
    const [showKey, setShowKey] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newKeyName, setNewKeyName] = useState("")
    const [keys, setKeys] = useState<ApiKey[]>([
        {
            id: "1",
            name: "Production API Key",
            prefix: "ik_prod_****",
            createdAt: "Jan 15, 2024",
            lastUsed: "2 mins ago",
            status: 'active'
        },
        {
            id: "2",
            name: "Development Key",
            prefix: "ik_dev_****",
            createdAt: "Dec 10, 2023",
            lastUsed: "Jan 10, 2024",
            status: 'active'
        },
    ])

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("API key copied to clipboard")
    }

    const handleCreateKey = () => {
        setIsCreating(false)
        setNewKeyName("")
        toast.success("New API key created successfully")
        // Logic to actually add key...
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            API Keys
                        </h1>
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400">
                            Developer Access
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Manage API keys for accessing the platform programmatically.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9">
                        <IconCode className="mr-2 h-4 w-4" />
                        API Docs
                    </Button>
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-9">
                                <IconPlus className="mr-2 h-4 w-4" />
                                Create Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New API Key</DialogTitle>
                                <DialogDescription>
                                    This key will allow access to all resources in your project.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Key Name</Label>
                                    <Input
                                        placeholder="e.g. CI/CD Pipeline"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button onClick={handleCreateKey}>Generate Key</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger
                        value="active"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Active Keys
                    </TabsTrigger>
                    <TabsTrigger
                        value="logs"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
                    >
                        Usage Logs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="pt-6">
                    <Card className="border-none shadow-sm bg-background">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-base font-medium">Your API Keys</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="rounded-xl border border-border/60 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-muted/30 border-b border-border/60">
                                            <TableHead className="w-[200px]">Name</TableHead>
                                            <TableHead>Key Token</TableHead>
                                            <TableHead className="w-[100px]">Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Last Used</TableHead>
                                            <TableHead className="text-right w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {keys.map((key) => (
                                            <TableRow key={key.id} className="hover:bg-muted/20 border-border/60">
                                                <TableCell className="font-medium text-foreground">{key.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono text-muted-foreground border border-border/50">
                                                            {showKey === key.id ? "ik_prod_sk_abc123xyz789" : key.prefix}
                                                        </code>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                                onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                                                            >
                                                                {showKey === key.id ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                                onClick={() => handleCopy("ik_prod_sk_abc123xyz789")}
                                                            >
                                                                <IconCopy size={14} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={key.status === 'active' ? 'default' : 'secondary'} className={cn(
                                                        "font-normal text-[10px]",
                                                        key.status === 'active'
                                                            ? "bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100/60 dark:bg-emerald-900/20 dark:text-emerald-400 border-0"
                                                            : ""
                                                    )}>
                                                        {key.status === 'active' ? 'Active' : 'Revoked'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{key.createdAt}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{key.lastUsed}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                        <IconTrash size={16} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs" className="pt-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed">
                        <div className="p-3 rounded-full bg-muted mb-3 opacity-50">
                            <IconHistory className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground">No Usage Logs</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                            API usage will appear here once you start making requests.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
