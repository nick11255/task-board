/** A row of public.board_settings (0004): one per guest. */
export type BoardSettings = {
  user_id: string
  board_name: string
  updated_at: string
}

/** Mirrors board_settings_name_valid: 1–60 characters, stored trimmed. */
export const BOARD_NAME_MAX_LENGTH = 60
