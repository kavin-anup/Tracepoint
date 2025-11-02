import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
