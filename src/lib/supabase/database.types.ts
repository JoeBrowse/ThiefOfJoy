
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "assessment_questions": {
                  Row: {
                    "category_id": string,"id": string,"is_active": boolean,"position": number,"prompt": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"id": string,"is_active"?: boolean,"position": number,"prompt": string
                  }
                  Update: {
                    "category_id"?: string,"id"?: string,"is_active"?: boolean,"position"?: number,"prompt"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assessment_questions_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "life_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"assessment_sessions": {
                  Row: {
                    "category_id": string | null,"completed_at": string | null,"current_step": number,"id": string,"kind": string,"started_at": string,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"completed_at"?: string | null,"current_step"?: number,"id"?: string,"kind": string,"started_at"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "category_id"?: string | null,"completed_at"?: string | null,"current_step"?: number,"id"?: string,"kind"?: string,"started_at"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assessment_sessions_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "life_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assessment_sessions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"category_score_history": {
                  Row: {
                    "category_id": string,"created_at": string,"id": number,"new_score": number,"note": string | null,"previous_score": number | null,"session_id": string | null,"source": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"created_at"?: string,"id"?: never,"new_score": number,"note"?: string | null,"previous_score"?: number | null,"session_id"?: string | null,"source": string,"user_id": string
                  }
                  Update: {
                    "category_id"?: string,"created_at"?: string,"id"?: never,"new_score"?: number,"note"?: string | null,"previous_score"?: number | null,"session_id"?: string | null,"source"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "category_score_history_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "life_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "category_score_history_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "assessment_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "category_score_history_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"category_scores": {
                  Row: {
                    "answered_count": number,"base_score": number,"category_id": string,"last_session_id": string | null,"previous_score": number | null,"score": number,"source": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answered_count"?: number,"base_score": number,"category_id": string,"last_session_id"?: string | null,"previous_score"?: number | null,"score": number,"source": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "answered_count"?: number,"base_score"?: number,"category_id"?: string,"last_session_id"?: string | null,"previous_score"?: number | null,"score"?: number,"source"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "category_scores_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "life_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "category_scores_last_session_id_fkey"
      columns: ["last_session_id"]
isOneToOne: false
      referencedRelation: "assessment_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "category_scores_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comment_votes": {
                  Row: {
                    "comment_id": string,"created_at": string,"user_id": string,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id": string,"created_at"?: string,"user_id"?: string,"value": number
                  }
                  Update: {
                    "comment_id"?: string,"created_at"?: string,"user_id"?: string,"value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "comment_votes_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comment_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"depth": number,"edited_at": string | null,"id": string,"is_deleted": boolean,"is_removed": boolean,"parent_id": string | null,"post_id": string,"score": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"depth"?: number,"edited_at"?: string | null,"id"?: string,"is_deleted"?: boolean,"is_removed"?: boolean,"parent_id"?: string | null,"post_id": string,"score"?: number,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"depth"?: number,"edited_at"?: string | null,"id"?: string,"is_deleted"?: boolean,"is_removed"?: boolean,"parent_id"?: string | null,"post_id"?: string,"score"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"custom_goal_updates": {
                  Row: {
                    "created_at": string,"goal_id": string,"id": number,"new_score": number,"note": string | null,"previous_score": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"goal_id": string,"id"?: never,"new_score": number,"note"?: string | null,"previous_score"?: number | null,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"goal_id"?: string,"id"?: never,"new_score"?: number,"note"?: string | null,"previous_score"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "custom_goal_updates_goal_id_fkey"
      columns: ["goal_id"]
isOneToOne: false
      referencedRelation: "custom_goals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "custom_goal_updates_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"custom_goals": {
                  Row: {
                    "category_id": string | null,"counts_toward_category": boolean,"created_at": string,"current_score": number,"description": string | null,"id": string,"is_public": boolean,"name": string,"start_score": number,"status": string,"target_date": string | null,"target_score": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"counts_toward_category"?: boolean,"created_at"?: string,"current_score"?: number,"description"?: string | null,"id"?: string,"is_public"?: boolean,"name": string,"start_score": number,"status"?: string,"target_date"?: string | null,"target_score": number,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "category_id"?: string | null,"counts_toward_category"?: boolean,"created_at"?: string,"current_score"?: number,"description"?: string | null,"id"?: string,"is_public"?: boolean,"name"?: string,"start_score"?: number,"status"?: string,"target_date"?: string | null,"target_score"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "custom_goals_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "life_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "custom_goals_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"leaderboard_history": {
                  Row: {
                    "created_at": string,"id": number,"life_score": number | null,"previous_rank": number | null,"rank": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"life_score"?: number | null,"previous_rank"?: number | null,"rank"?: number | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"life_score"?: number | null,"previous_rank"?: number | null,"rank"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "leaderboard_history_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"life_categories": {
                  Row: {
                    "id": string,"name": string,"position": number,"short_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"name": string,"position": number,"short_name": string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"position"?: number,"short_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"life_score_history": {
                  Row: {
                    "categories_scored": number,"category_id": string | null,"created_at": string,"id": number,"is_complete": boolean,"life_score": number,"previous_life_score": number | null,"source": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "categories_scored": number,"category_id"?: string | null,"created_at"?: string,"id"?: never,"is_complete": boolean,"life_score": number,"previous_life_score"?: number | null,"source": string,"user_id": string
                  }
                  Update: {
                    "categories_scored"?: number,"category_id"?: string | null,"created_at"?: string,"id"?: never,"is_complete"?: boolean,"life_score"?: number,"previous_life_score"?: number | null,"source"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "life_score_history_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "life_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "life_score_history_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"post_votes": {
                  Row: {
                    "created_at": string,"post_id": string,"user_id": string,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"post_id": string,"user_id"?: string,"value": number
                  }
                  Update: {
                    "created_at"?: string,"post_id"?: string,"user_id"?: string,"value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_votes_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string | null,"body": string,"category_id": string | null,"comment_count": number,"created_at": string,"custom_category": string | null,"edited_at": string | null,"id": string,"is_removed": boolean,"last_activity_at": string,"removed_reason": string | null,"score": number,"search": unknown,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body"?: string,"category_id"?: string | null,"comment_count"?: number,"created_at"?: string,"custom_category"?: string | null,"edited_at"?: string | null,"id"?: string,"is_removed"?: boolean,"last_activity_at"?: string,"removed_reason"?: string | null,"score"?: number,"search"?: never,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"category_id"?: string | null,"comment_count"?: number,"created_at"?: string,"custom_category"?: string | null,"edited_at"?: string | null,"id"?: string,"is_removed"?: boolean,"last_activity_at"?: string,"removed_reason"?: string | null,"score"?: number,"search"?: never,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "life_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "bio": string | null,"created_at": string,"display_name": string | null,"id": string,"is_admin": boolean,"onboarded_at": string | null,"public_category_scores": boolean,"public_goals": boolean,"show_on_leaderboard": boolean,"updated_at": string,"username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bio"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"is_admin"?: boolean,"onboarded_at"?: string | null,"public_category_scores"?: boolean,"public_goals"?: boolean,"show_on_leaderboard"?: boolean,"updated_at"?: string,"username"?: string | null
                  }
                  Update: {
                    "bio"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"is_admin"?: boolean,"onboarded_at"?: string | null,"public_category_scores"?: boolean,"public_goals"?: boolean,"show_on_leaderboard"?: boolean,"updated_at"?: string,"username"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"question_answers": {
                  Row: {
                    "question_id": string,"score": number | null,"session_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "question_id": string,"score"?: number | null,"session_id": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "question_id"?: string,"score"?: number | null,"session_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "question_answers_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "assessment_questions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "question_answers_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "assessment_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "question_answers_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "comment_id": string | null,"created_at": string,"id": string,"post_id": string | null,"reason": string,"reporter_id": string | null,"resolved_at": string | null,"resolved_by": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"post_id"?: string | null,"reason": string,"reporter_id"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string
                  }
                  Update: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"post_id"?: string | null,"reason"?: string,"reporter_id"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"session_category_notes": {
                  Row: {
                    "category_id": string,"note": string,"session_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"note": string,"session_id": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "category_id"?: string,"note"?: string,"session_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_category_notes_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "life_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_category_notes_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "assessment_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_category_notes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_stats": {
                  Row: {
                    "categories_scored": number,"current_rank": number | null,"is_complete": boolean,"life_score": number | null,"previous_life_score": number | null,"previous_rank": number | null,"rank_changed_at": string | null,"score_reached_at": string | null,"score_updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "categories_scored"?: number,"current_rank"?: number | null,"is_complete"?: boolean,"life_score"?: number | null,"previous_life_score"?: number | null,"previous_rank"?: number | null,"rank_changed_at"?: string | null,"score_reached_at"?: string | null,"score_updated_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "categories_scored"?: number,"current_rank"?: number | null,"is_complete"?: boolean,"life_score"?: number | null,"previous_life_score"?: number | null,"previous_rank"?: number | null,"rank_changed_at"?: string | null,"score_reached_at"?: string | null,"score_updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_stats_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "_apply_category_score":
{ Args: { "p_answered": number,"p_base": number,"p_category": string,"p_note": string,"p_session": string,"p_source": string,"p_user": string }; Returns: number
                           },
"_recalculate_life_score":
{ Args: { "p_category"?: string,"p_source": string,"p_user": string }; Returns: undefined
                           },
"_refresh_goal_blend":
{ Args: { "p_category": string,"p_user": string }; Returns: boolean
                           },
"delete_comment":
{ Args: { "p_comment": string }; Returns: undefined
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"moderate_remove_post":
{ Args: { "p_post": string,"p_reason"?: string }; Returns: undefined
                           },
"moderate_restore_post":
{ Args: { "p_post": string }; Returns: undefined
                           },
"quick_update_category":
{ Args: { "p_category": string,"p_note"?: string,"p_score": number }; Returns: Json
                           },
"refresh_leaderboard":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"resolve_report":
{ Args: { "p_report": string,"p_status": string }; Returns: undefined
                           },
"submit_assessment":
{ Args: { "p_session": string }; Returns: Json
                           },
"username_available":
{ Args: { "p_username": string }; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
