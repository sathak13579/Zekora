export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          user_id: string
          status: 'draft' | 'ready' | 'completed'
          player_limit: number
          has_timer: boolean
          question_timer_seconds: number
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          user_id: string
          status?: 'draft' | 'ready' | 'completed'
          player_limit?: number
          has_timer?: boolean
          question_timer_seconds?: number
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          user_id?: string
          status?: 'draft' | 'ready' | 'completed'
          player_limit?: number
          has_timer?: boolean
          question_timer_seconds?: number
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          options: Json
          correct_answer: string
          explanation: string
          order: number
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          options: Json
          correct_answer: string
          explanation: string
          order: number
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          options?: Json
          correct_answer?: string
          explanation?: string
          order?: number
        }
      }
      game_sessions: {
        Row: {
          id: string
          quiz_id: string
          host_id: string
          pin: string
          status: 'waiting' | 'active' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          host_id: string
          pin: string
          status?: 'waiting' | 'active' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          host_id?: string
          pin?: string
          status?: 'waiting' | 'active' | 'completed'
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          session_id: string
          nickname: string
          total_score: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          nickname: string
          total_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          nickname?: string
          total_score?: number
          created_at?: string
        }
      }
      player_answers: {
        Row: {
          id: string
          player_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          response_time_ms: number
          score: number
        }
        Insert: {
          id?: string
          player_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          response_time_ms: number
          score: number
        }
        Update: {
          id?: string
          player_id?: string
          question_id?: string
          selected_answer?: string
          is_correct?: boolean
          response_time_ms?: number
          score?: number
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          is_pro: boolean
          subdomain: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          is_pro?: boolean
          subdomain?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          is_pro?: boolean
          subdomain?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}