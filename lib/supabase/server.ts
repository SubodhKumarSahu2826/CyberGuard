import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  console.log("[v0] Supabase environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = new Error("Missing required Supabase environment variables")
    console.error("[v0] Environment error:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing",
    })
    throw error
  }

  try {
    const url = new URL(supabaseUrl)
    if (!url.hostname.includes("supabase")) {
      console.warn("[v0] URL doesn't appear to be a Supabase URL:", url.hostname)
    }
  } catch (urlError) {
    console.error("[v0] Invalid Supabase URL format:", {
      url: supabaseUrl,
      error: urlError instanceof Error ? urlError.message : "Unknown URL error",
    })
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
  }

  if (supabaseAnonKey.length < 100 || !supabaseAnonKey.includes(".")) {
    console.error("[v0] Invalid Supabase anon key format - should be a JWT token")
    throw new Error("Invalid Supabase anon key format")
  }

  try {
    console.log("[v0] Creating Supabase client with validated credentials")
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })
  } catch (clientError) {
    console.error("[v0] Error creating Supabase client:", {
      error: clientError instanceof Error ? clientError.message : "Unknown client error",
      url: supabaseUrl.substring(0, 30) + "...",
      keyPrefix: supabaseAnonKey.substring(0, 20) + "...",
    })
    throw clientError
  }
}
