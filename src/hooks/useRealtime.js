import { useEffect, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'

// Realtime is the primary delivery path. A small polling fallback keeps chats
// working even when the browser/network temporarily cannot establish a
// Postgres Changes websocket (common with ad-blockers, strict networks, etc.).
export function useRealtimeMessages(conversationId, onChange, onRefresh) {
  const onChangeRef = useRef(onChange)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { onRefreshRef.current = onRefresh }, [onRefresh])

  useEffect(() => {
    if (!conversationId) return

    let disposed = false
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        if (!disposed) onChangeRef.current?.(payload)
      })
      .subscribe(status => {
        // If Realtime is unavailable, polling below still keeps the chat live.
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onRefreshRef.current?.()
        }
      })

    const timer = window.setInterval(() => {
      if (!disposed) onRefreshRef.current?.()
    }, 3000)

    return () => {
      disposed = true
      window.clearInterval(timer)
      supabase.removeChannel(channel)
    }
  }, [conversationId])
}
