import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error
    const { supabase } = auth

    const { data: notifications, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    const { count: unreadCount } = await supabase
      .from("admin_notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false)

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    })
  } catch (err) {
    console.error("Admin notifications error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error
    const { supabase } = auth

    const { error } = await supabase
      .from("admin_notifications")
      .update({ read: true })
      .eq("read", false)

    if (error) {
      return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Admin notifications update error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
