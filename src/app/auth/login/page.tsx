"use client"

import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginInput } from "@/lib/validations"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/account"
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setError("")
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError(authError.message)
      toast.error(authError.message)
      return
    }

    if (data.rememberMe) {
      localStorage.setItem("remember_me", "1")
    } else {
      localStorage.removeItem("remember_me")
    }

    const guestCart = sessionStorage.getItem("guest_cart")
    if (guestCart) {
      try {
        const items = JSON.parse(guestCart)
        if (items.length > 0) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: existingCart } = await supabase
              .from("carts").select("id").eq("user_id", user.id).maybeSingle()
            let cartId = existingCart?.id
            if (!cartId) {
              const { data: newCart } = await supabase
                .from("carts").insert({ user_id: user.id }).select("id").single()
              cartId = newCart?.id
            }
            if (cartId) {
              for (const item of items) {
                const { data: existingItem } = await supabase
                  .from("cart_items").select("id, quantity")
                  .eq("cart_id", cartId).eq("product_id", item.product_id).maybeSingle()
                if (existingItem) {
                  await supabase.from("cart_items")
                    .update({ quantity: existingItem.quantity + item.quantity })
                    .eq("id", existingItem.id)
                } else {
                  await supabase.from("cart_items").insert({
                    cart_id: cartId,
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    price_at_time: item.price_at_time,
                  })
                }
              }
              sessionStorage.removeItem("guest_cart")
            }
          }
        }
      } catch { /* ignore parse errors */ }
    }

    toast.success("Welcome back!")
    router.push(redirect)
    router.refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12"
    >
      <div className="mb-8 text-center">
        <Link href="/" className="font-heading text-2xl font-bold text-brand-forest">
          Textile Impressions
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-bold text-brand-forest">Welcome Back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest/20"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest/20"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            href="/auth/reset-password"
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-brand-forest"
          >
            Forgot password?
          </Link>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="h-4 w-4 rounded border-border text-brand-forest focus:ring-brand-forest/20"
          />
          <span className="text-sm text-muted-foreground">Remember me on this device</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-brand-forest underline underline-offset-2"
        >
          Sign up
        </Link>
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-forest border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
