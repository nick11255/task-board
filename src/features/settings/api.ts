import { supabase } from '../../lib/supabase'

/** The guest's saved board name, or null if they've never renamed it. RLS scopes it to auth.uid(). */
export async function fetchBoardName(): Promise<string | null> {
  const { data, error } = await supabase.from('board_settings').select('board_name').maybeSingle()
  if (error) throw error
  return data?.board_name ?? null
}

/**
 * Insert-or-update the one settings row. user_id isn't sent: the column
 * default fills it, and the primary key turns a second save into an update.
 */
export async function saveBoardName(boardName: string): Promise<string> {
  const { data, error } = await supabase
    .from('board_settings')
    .upsert({ board_name: boardName }, { onConflict: 'user_id' })
    .select('board_name')
    .single()
  if (error) throw error
  return data.board_name
}
