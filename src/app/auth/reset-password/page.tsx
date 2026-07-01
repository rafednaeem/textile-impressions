"use client"

import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { resetPasswordSchema } from "@/lib/validations"
import { z } from "zod"

const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

function ResetContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [sent, setSent] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  const emailForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  })

  const passwordForm = useForm({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onBlur",
  })

  const sendResetEmail = async (data: { email: string }) => {
    setError("")
    const { error: err } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password?token=true`,
    })
    if (err) {
      setError(err.message)
      return
    }
    setSent(true)
  }

  const updatePassword = async (data: { password: string }) => {
    setError("")
    const { error: err } = await supabase.auth.updateUser({
      password: data.password,
    })
    if (err) {
      setError(err.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 font-heading text-xl font-bold text-brand-forest">
          Password Updated
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your password has been reset successfully.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 font-heading text-xl font-bold text-brand-forest">
          Check Your Email
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists with that email, we&apos;ve sent password reset instructions.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm text-brand-forest underline underline-offset-2"
        >
          Back to Sign In
        </Link>
      </div>
    )
  }

  if (token) {
    return (
      <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-brand-forest">Set New Password</h2>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">New Password</label>
          <input
            type="password"
            {...passwordForm.register("password")}
            aria-invalid={!!passwordForm.formState.errors.password}
            aria-describedby={passwordForm.formState.errors.password ? "new-password-error" : undefined}
            className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
              passwordForm.formState.errors.password
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : passwordForm.formState.touchedFields?.password && passwordForm.formState.dirtyFields?.password
                  ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
            }`}
            placeholder="••••••••"
          />
          {passwordForm.formState.errors.password && (
            <p id="new-password-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
              {passwordForm.formState.errors.password.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">Confirm Password</label>
          <input
            type="password"
            {...passwordForm.register("confirmPassword")}
            aria-invalid={!!passwordForm.formState.errors.confirmPassword}
            aria-describedby={passwordForm.formState.errors.confirmPassword ? "confirm-password-error" : undefined}
            className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
              passwordForm.formState.errors.confirmPassword
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : passwordForm.formState.touchedFields?.confirmPassword && passwordForm.formState.dirtyFields?.confirmPassword
                  ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
            }`}
            placeholder="••••••••"
          />
          {passwordForm.formState.errors.confirmPassword && (
            <p id="confirm-password-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
              {passwordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={passwordForm.formState.isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {passwordForm.formState.isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Update Password
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={emailForm.handleSubmit(sendResetEmail)} className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-brand-forest">Reset Password</h2>
      <p className="text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          {...emailForm.register("email")}
          aria-invalid={!!emailForm.formState.errors.email}
          aria-describedby={emailForm.formState.errors.email ? "reset-email-error" : undefined}
          className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
            emailForm.formState.errors.email
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : emailForm.formState.touchedFields?.email && emailForm.formState.dirtyFields?.email
                ? "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                : "border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
          }`}
          placeholder="you@example.com"
        />
        {emailForm.formState.errors.email && (
          <p id="reset-email-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
            {emailForm.formState.errors.email.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={emailForm.formState.isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {emailForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Send Reset Link
      </button>
      <Link
        href="/auth/login"
        className="block text-center text-sm text-muted-foreground underline underline-offset-2"
      >
        Back to Sign In
      </Link>
    </form>
  )
}

export default function ResetPasswordPage() {
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
      </div>
      <Suspense fallback={<div className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>}>
        <ResetContent />
      </Suspense>
    </motion.div>
  )
}
