import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid errors during build time
let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // During build/SSR (when window is undefined), create a client with fallback values
  // This prevents build-time errors when env vars aren't available
  if (typeof window === 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    
    if (!supabaseClient) {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    }
    return supabaseClient
  }

  // Client-side: validate and create/return client
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }

  return supabaseClient
}

// Create a proxy that lazily initializes the client when accessed
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient()
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    // If it's a function, bind it to the client to maintain 'this' context
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          project_details: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          project_details?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          project_details?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bugs: {
        Row: {
          id: string
          project_id: string
          bug_id: string
          portal: string
          priority: string
          module_feature: string | null
          bug_description: string | null
          status: string
          assigned_to: string
          client_notes: Array<{note: string, timestamp: string}> | null
          developer_notes: Array<{note: string, timestamp: string}> | null
          status_history: Array<{status: string, timestamp: string}> | null
          attachments: Array<{name: string, url: string, size: number, type: string}> | null
          date_added: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          bug_id?: string
          portal?: string
          priority?: string
          module_feature?: string | null
          bug_description?: string | null
          status?: string
          assigned_to?: string
          client_notes?: Array<{note: string, timestamp: string}> | null
          developer_notes?: Array<{note: string, timestamp: string}> | null
          status_history?: Array<{status: string, timestamp: string}> | null
          attachments?: Array<{name: string, url: string, size: number, type: string}> | null
          date_added?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          bug_id?: string
          portal?: string
          priority?: string
          module_feature?: string | null
          bug_description?: string | null
          status?: string
          assigned_to?: string
          client_notes?: Array<{note: string, timestamp: string}> | null
          developer_notes?: Array<{note: string, timestamp: string}> | null
          status_history?: Array<{status: string, timestamp: string}> | null
          attachments?: Array<{name: string, url: string, size: number, type: string}> | null
          date_added?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
