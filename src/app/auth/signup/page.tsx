"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { signupSchema, type SignupInput } from "@/lib/validations"

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [isPendingVerification, setIsPendingVerification] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields, dirtyFields },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  })

  const getFieldState = (fieldName: keyof SignupInput) => {
    if (errors[fieldName]) return "error"
    if (touchedFields[fieldName] && dirtyFields[fieldName] && !errors[fieldName]) return "valid"
    return "idle"
  }

  const getFieldBorder = (fieldName: keyof SignupInput) => {
    const state = getFieldState(fieldName)
    if (state === "error") return "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
    if (state === "valid") return "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
    return "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
  }

  const onSubmit = async (data: SignupInput) => {
    setError("")
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone || null,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      toast.error(authError.message)
      return
    }

    if (authData.user && !authData.session) {
      setRegisteredEmail(data.email)
      setIsPendingVerification(true)
      toast.success("Please verify your email address.")
      return
    }

    toast.success("Account created! Welcome to Textile Impressions.")
    router.push("/account?welcome=true")
    router.refresh()
  }

  if (isPendingVerification) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12"
      >
        <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-forest/10 text-brand-forest">
            <Mail className="h-8 w-8 animate-bounce" />
          </div>

          <h1 className="font-heading text-3xl font-bold text-brand-forest">Verify Your Email</h1>
          
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We have sent a verification link to:
          </p>
          
          <p className="mt-2 text-base font-semibold text-brand-umber bg-brand-ivory/80 rounded-md py-1.5 px-3 inline-block">
            {registeredEmail}
          </p>
          
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Please check your inbox (and spam folder) and click the link to confirm your account and log in.
          </p>

          <div className="mt-8 space-y-4">
            <Link
              href="/auth/login"
              className="flex w-full items-center justify-center rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90"
            >
              Go to Sign In
            </Link>
            
            <button
              onClick={() => {
                setIsPendingVerification(false)
                setError("")
              }}
              className="text-xs text-muted-foreground underline hover:text-brand-umber transition-colors"
            >
              Sign up with a different email
            </button>
          </div>
        </div>
      </motion.div>
    )
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
        <h1 className="mt-4 font-heading text-3xl font-bold text-brand-forest">Create Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Join the Textile Impressions family</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            {...register("fullName")}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${getFieldBorder("fullName")}`}
            placeholder="Fatima Ahmed"
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${getFieldBorder("email")}`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            {...register("phone")}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${getFieldBorder("phone")}`}
            placeholder="03XXXXXXXXX"
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
              {errors.phone.message}
            </p>
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
              autoComplete="new-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`block w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm outline-none transition-colors ${getFieldBorder("password")}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirm Password
          </label>
          <div className="relative mt-1">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              className={`block w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm outline-none transition-colors ${getFieldBorder("confirmPassword")}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-brand-forest underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
