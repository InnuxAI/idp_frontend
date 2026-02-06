"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { LoginFormData, loginSchema } from "@/lib/auth-types"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, data.remember_me)
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        router.push("/dashboard")
      }, 100)
    } catch (error) {
      // Error is handled by context (toast shown)
      console.error("Login error:", error)
    }
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Left Side - Visuals */}
      <div className="relative hidden h-full flex-col bg-zinc-900 p-10 text-white lg:flex">
        {/* Gradient Background */}
        {/* <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-black" /> */}

        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            initial={{ height: "200%", scale: 1, y: 0 }}
            animate={{
              height: "100%",
              scale: [1, 1.2, 1],
              y: [0, -110, 0]
            }}
            transition={{
              height: { duration: 1.5, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 10, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            src="/herogradient.webp"
            alt="Gradient"
            className="w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/30 to-black/70" />
        </div>

        {/* Logo */}
        <div className="relative z-20 flex items-center text-lg font-medium">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <div className="backdrop-blur-md p-1.5 rounded-lg border border-white/10">
              <img src="https://www.emamiltd.in/wp-content/themes/emami/images/emami_new_logo2.png" alt="Emami Logo" className="h-16 w-auto" />
            </div>
            <div className="backdrop-blur-md py-1.5 px-2 rounded-lg border border-white/10">
              <img src="/innuxlogo.svg" alt="Innux Logo" className="h-16 w-auto" />
            </div>
            {/* <span className="font-bold tracking-tight text-xl text-black">Innux AI</span> */}
          </motion.div>
        </div>

        {/* Tagline */}
        <div className="relative z-20 mt-auto">
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-2"
          >
            <p className="text-lg font-light leading-relaxed text-zinc-300">
              &ldquo;Your intelligent thinking partner for document processing and knowledge extraction. Experience the power of AI-driven insights.&rdquo;
            </p>
          </motion.blockquote>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="mx-auto w-full max-w-[400px] space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col space-y-2 text-center"
          >
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-400">
              Enter your credentials to access your account
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    {...form.register("email")}
                    className={`h-11 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${form.formState.errors.email ? "border-red-500 focus:border-red-500" : ""
                      }`}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-400 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    {...form.register("password")}
                    className={`h-11 pr-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${form.formState.errors.password ? "border-red-500 focus:border-red-500" : ""
                      }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-zinc-400 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-400 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-900/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-sm text-zinc-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup/form"
                  className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  Sign up
                </Link>
              </p>

              <Link
                href="/signup/otp"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors block"
              >
                Want secure signup with OTP?
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
