'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

export default function UnauthorizedPage() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10">
                        <ShieldX className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription className="text-base">
                        You don't have permission to access this page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground">
                        <p>
                            Your current role <strong className="text-foreground">({user?.role || 'none'})</strong> doesn't
                            have the required permissions for this resource.
                        </p>
                        <p className="mt-2">
                            If you believe you should have access, please contact your administrator.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" className="flex-1" asChild>
                            <Link href="/dashboard">
                                <Home className="h-4 w-4 mr-2" />
                                Go to Dashboard
                            </Link>
                        </Button>
                        <Button variant="default" className="flex-1" onClick={() => window.history.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
