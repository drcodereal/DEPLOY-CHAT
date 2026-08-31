import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, Check, CheckCheck, Lock, Phone, Send, UsersRound, Video } from 'lucide-react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useRealtimeMessages } from '../hooks/useRealtime'

export default function ChatWindow({ chat, onBack, onStartCall }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [memberNames, setMemberNames] = useState({})
  const endRef = useRef(null)
  const isGroup = Boolean(chat?.is_group)

  const markMessagesRead = useCallback(async () => {
    if (!chat?.id || !user?.id) return
    // Reading a conversation always clears its incoming unread badge.
    // This intentionally does not depend on the optional read-receipts setting.
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', chat.id)
      .eq('is_read', false)
      .neq('sender_id', user.id)
    if (error) console.error('Unable to mark messages as read:', error)
  }, [chat?.id, user?.id])

  const loadMessages = useCallback(async () => {
    if (!chat?.id) return
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', chat.id)
      .order('created_at', { ascending: true })
    if (!error) {
      setMessages(data || [])
      await markMessagesRead()
    }
  }, [chat?.id, markMessagesRead])

  useEffect(() => { loadMessages() }, [loadMessages])

  useEffect(() => {
    if (!isGroup || !chat?.id) { setMemberNames({}); return }
    supabase.from('group_members').select('user_id, profiles(full_name)').eq('conversation_id', chat.id)
      .then(({ data }) => {
        const map = {}
        for (const row of data || []) map[row.user_id] = row.profiles?.full_name || 'Member'
        setMemberNames(map)
      })
  }, [isGroup, chat?.id])

  useRealtimeMessages(chat?.id, async (payload) => {
    if (payload.eventType === 'INSERT') {
      setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
      if (payload.new.sender_id !== user?.id && document.visibilityState === 'visible' && document.hasFocus()) {
        await supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).eq('sender_id', payload.new.sender_id)
      }
    } else if (payload.eventType === 'UPDATE') {
      setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
    }
  }, loadMessages)

  useEffect(() => {
    if (!chat?.id) return
    const handleRead = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) markMessagesRead()
    }
    window.addEventListener('focus', handleRead)
    document.addEventListener('visibilitychange', handleRead)
    return () => {
      window.removeEventListener('focus', handleRead)
      document.removeEventListener('visibilitychange', handleRead)
    }
  }, [chat?.id, markMessagesRead])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || !chat?.id || sending) return
    setSending(true)
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: chat.id, sender_id: user.id, content, message_type: 'text', is_read: false,
    }).select().single()
    if (!error && data) {
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data])
      setNewMessage('')
    } else if (error) {
      alert(error.message)
    }
    setSending(false)
  }

  const subtitle = useMemo(() => {
    if (isGroup) {
      const count = Object.keys(memberNames).length
      return count ? `${count} members` : 'Group'
    }
    return chat?.otherUser?.is_online ? 'online' : `last seen ${chat?.otherUser?.last_seen ? format(new Date(chat.otherUser.last_seen), 'h:mm a') : 'recently'}`
  }, [isGroup, memberNames, chat])

  if (!chat) return <div className="flex-1 hidden md:flex items-center justify-center bg-whatsapp-chat-bg text-whatsapp-text-secondary"><div className="text-center"><Send size={40} className="mx-auto mb-3 opacity-40"/><p>Select a chat to start messaging</p></div></div>

  const name = chat.otherUser?.full_name || 'Unknown user'

  return (
    <div className="flex-1 flex flex-col bg-whatsapp-chat-bg min-w-0">
      <header className="h-16 shrink-0 bg-whatsapp-panel px-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="md:hidden text-whatsapp-text-secondary"><ArrowLeft size={22}/></button>
          <div className="avatar">{isGroup ? <UsersRound size={20}/> : name[0]?.toUpperCase()}</div>
          <div className="min-w-0"><h3 className="font-medium truncate">{name}</h3><p className="text-xs text-whatsapp-text-secondary">{subtitle}</p></div>
        </div>
        {!isGroup && (
          <div className="flex gap-1">
            <button onClick={() => onStartCall('voice')} className="icon-btn"><Phone size={19}/></button>
            <button onClick={() => onStartCall('video')} className="icon-btn"><Video size={19}/></button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        {messages.map((msg, i) => {
          const mine = msg.sender_id === user.id
          const date = new Date(msg.created_at)
          const previous = i ? new Date(messages[i-1].created_at) : null
          const newDay = !previous || format(date, 'yyyy-MM-dd') !== format(previous, 'yyyy-MM-dd')
          const showSenderName = isGroup && !mine && (i === 0 || messages[i-1].sender_id !== msg.sender_id)
          return (
            <div key={msg.id}>
              {newDay && <div className="text-center my-4"><span className="date-pill">{format(date, 'MMMM d, yyyy')}</span></div>}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={mine ? 'bubble bubble-me' : 'bubble bubble-in'}>
                  {showSenderName && <div className="text-xs font-semibold text-whatsapp-green mb-0.5">{memberNames[msg.sender_id] || 'Member'}</div>}
                  <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                    {format(date, 'h:mm a')}
                    {mine && !isGroup && (
                      msg.is_read
                        ? <CheckCheck size={13} className="text-sky-400 opacity-100"/>
                        : msg.is_delivered
                          ? <CheckCheck size={13}/>
                          : <Check size={13}/>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef}/>
      </main>

      <div className="encryption-note">
        <Lock size={11}/> Messages are end-to-end encrypted. No one outside this chat, not even ChatApp, can read them.
      </div>

      <form onSubmit={sendMessage} className="shrink-0 min-h-16 bg-whatsapp-panel px-3 py-3 flex items-center gap-2 border-t border-gray-700">
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message" className="input flex-1" autoComplete="off"/>
        <button disabled={!newMessage.trim() || sending} className="send-btn" aria-label="Send"><Send size={18}/></button>
      </form>
    </div>
  )
}
