"use client"

import { useState, useCallback, useRef } from "react"
import type { ZodSchema } from "zod"

interface FieldValidationState {
  touched: Record<string, boolean>
  errors: Record<string, string>
}

export function useFieldValidation<T extends Record<string, any>>(
  schema: ZodSchema,
  values: T,
  options?: { validateOnChange?: boolean }
) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const prevValuesRef = useRef<T>(values)

  const validateAll = useCallback(() => {
    const result = schema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }, [schema, values])

  const validateField = useCallback(
    (name: string) => {
      const result = schema.safeParse(values)
      if (!result.success) {
        const fieldError = result.error.issues.find((i) => i.path[0] === name)
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [name]: fieldError.message }))
        } else {
          setErrors((prev) => {
            const next = { ...prev }
            delete next[name]
            return next
          })
        }
      } else {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[name]
          return next
        })
      }
    },
    [schema, values]
  )

  const handleBlur = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }))
      validateField(name)
    },
    [validateField]
  )

  const handleChange = useCallback(
    (name: string) => {
      if (options?.validateOnChange !== false && touched[name]) {
        validateField(name)
      }
    },
    [touched, validateField, options?.validateOnChange]
  )

  const markAllTouched = useCallback(() => {
    const allTouched: Record<string, boolean> = {}
    for (const key of Object.keys(values)) {
      allTouched[key] = true
    }
    setTouched(allTouched)
  }, [values])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const getFieldState = useCallback(
    (name: string): "idle" | "error" | "valid" => {
      if (!touched[name]) return "idle"
      if (errors[name]) return "error"
      return "valid"
    },
    [touched, errors]
  )

  return {
    touched,
    errors,
    handleBlur,
    handleChange,
    validateAll,
    validateField,
    markAllTouched,
    clearErrors,
    getFieldState,
    setErrors,
  }
}
