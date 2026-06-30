import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (user.app_metadata?.role === "admin") {
    return { supabase, user }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role === "admin") {
    return { supabase, user }
  }

  return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
}

export async function requireAdminThrow() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  if (user.app_metadata?.role === "admin") {
    return { supabase, user }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role === "admin") {
    return { supabase, user }
  }

  throw new Error("Forbidden")
}
