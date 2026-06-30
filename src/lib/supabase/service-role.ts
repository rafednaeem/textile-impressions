import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

let client: ReturnType<typeof createClient<Database>> | null = null

export function getServiceRoleClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

  client = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return client
}
