"use client"

import { forwardRef } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type FieldState = "idle" | "error" | "valid"

function getInputBorderClasses(state: FieldState, baseClassName?: string) {
  const base = baseClassName ?? "block w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors"
  switch (state) {
    case "error":
      return `${base} border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200`
    case "valid":
      return `${base} border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200`
    default:
      return `${base} border-border focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20`
  }
}

interface FieldErrorProps {
  error?: string
  state: FieldState
  id?: string
}

function FieldError({ error, state, id }: FieldErrorProps) {
  if (state === "error" && error) {
    return (
      <p id={id} className="mt-1.5 flex items-center gap-1 text-xs text-red-500" role="alert">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {error}
      </p>
    )
  }
  return null
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  state: FieldState
  hint?: string
  icon?: React.ReactNode
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, error, state, hint, icon, className, id, ...props }, ref) => {
    const inputId = id || props.name
    const errorId = `${inputId}-error`

    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium">
            {label}
          </label>
        )}
        <div className="relative mt-1">
          {icon && (
            <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={state === "error"}
            aria-describedby={state === "error" ? errorId : undefined}
            className={`${getInputBorderClasses(state, className)} ${icon ? "pl-10" : ""}`}
            {...props}
          />
          {state === "valid" && (
            <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 pointer-events-none" />
          )}
          {state === "error" && (
            <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400 pointer-events-none" />
          )}
        </div>
        {hint && state === "idle" && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
        <FieldError error={error} state={state} id={errorId} />
      </div>
    )
  }
)
ValidatedInput.displayName = "ValidatedInput"

interface ValidatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  state: FieldState
  children: React.ReactNode
}

export const ValidatedSelect = forwardRef<HTMLSelectElement, ValidatedSelectProps>(
  ({ label, error, state, children, className, id, ...props }, ref) => {
    const selectId = id || props.name
    const errorId = `${selectId}-error`

    return (
      <div>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={state === "error"}
          aria-describedby={state === "error" ? errorId : undefined}
          className={`${getInputBorderClasses(state, className)}`}
          {...props}
        >
          {children}
        </select>
        <FieldError error={error} state={state} id={errorId} />
      </div>
    )
  }
)
ValidatedSelect.displayName = "ValidatedSelect"

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  state: FieldState
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ label, error, state, className, id, ...props }, ref) => {
    const textareaId = id || props.name
    const errorId = `${textareaId}-error`

    return (
      <div>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={state === "error"}
          aria-describedby={state === "error" ? errorId : undefined}
          className={`${getInputBorderClasses(state, className)}`}
          {...props}
        />
        <FieldError error={error} state={state} id={errorId} />
      </div>
    )
  }
)
ValidatedTextarea.displayName = "ValidatedTextarea"
