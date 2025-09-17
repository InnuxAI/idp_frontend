import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DocumentProvider } from "@/contexts/document-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalKeyboardShortcuts } from "@/components/global-keyboard-shortcuts";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Intelligent Document Processor",
  description: "AI-powered document analysis and chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <DocumentProvider>
              {children}
              <GlobalKeyboardShortcuts />
              <Toaster />
            </DocumentProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
