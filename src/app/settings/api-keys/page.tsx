"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { IconKey, IconCopy, IconEye, IconEyeOff, IconPlus, IconTrash } from "@tabler/icons-react"
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
    const [keys] = useState<ApiKey[]>([
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

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">API Keys</h1>
                    <p className="text-base text-muted-foreground mt-2">
                        Manage API keys for accessing the platform programmatically.
                    </p>
                </div>
                <Button className="gap-2">
                    <IconPlus size={16} />
                    Create New Key
                </Button>
            </div>

            <Separator className="my-6" />

            <Card>
                <CardHeader>
                    <CardTitle>Your API Keys</CardTitle>
                    <CardDescription>
                        Do not share your API keys with anyone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Key Token</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Last Used</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keys.map((key) => (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium">{key.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono border border-border">
                                                {showKey === key.id ? "ik_prod_sk_abc123xyz789" : key.prefix}
                                            </code>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowKey(showKey === key.id ? null : key.id)}>
                                                {showKey === key.id ? <IconEyeOff size={12} /> : <IconEye size={12} />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy("ik_prod_sk_abc123xyz789")}>
                                                <IconCopy size={12} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={key.status === 'active' ? 'default' : 'secondary'} className={key.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200 dark:border-emerald-800' : ''}>
                                            {key.status === 'active' ? 'Active' : 'Revoked'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{key.createdAt}</TableCell>
                                    <TableCell className="text-muted-foreground">{key.lastUsed}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <IconTrash size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
