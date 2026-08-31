import { useCallback, useEffect, useState } from 'react'
import { Search, UsersRound } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function ChatList({ onSelectChat, selectedChatId }) {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [search, setSearch] = useState('')

  const fetchChats = useCallback(async () => {
    if (!user) return

    const [{ data: directConvs, error: directError }, { data: myGroupRows }] = await Promise.all([
      supabase.from('conversations').select('*').eq('is_group', false).or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
      supabase.from('group_members').select('conversation_id').eq('user_id', user.id),
    ])
    if (directError) console.error(directError)

    const groupIds = (myGroupRows || []).map(r => r.conversation_id)
    const { data: groupConvs } = groupIds.length
      ? await supabase.from('conversations').select('*').in('id', groupIds)
      : { data: [] }

    const allConvs = [...(directConvs || []), ...(groupConvs || [])]

    const rows = await Promise.all(allConvs.map(async conv => {
      const [{ data: lastMessage }, { count }] = await Promise.all([
        supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id).eq('is_read', false).neq('sender_id', user.id),
      ])

      if (conv.is_group) {
        return { ...conv, otherUser: { full_name: conv.group_name, is_group: true }, lastMessage, unreadCount: count || 0 }
      }
      const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
      const { data: otherUser } = await supabase.from('profiles').select('*').eq('id', otherId).single()
      return { ...conv, otherUser, lastMessage, unreadCount: count || 0 }
    }))

    rows.sort((a, b) => new Date(b.lastMessage?.created_at || b.created_at) - new Date(a.lastMessage?.created_at || a.created_at))
    setChats(rows)
  }, [user])

  useEffect(() => {
    fetchChats()
    if (!user) return
    const ch = supabase.channel(`chat-list:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchChats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchChats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, fetchChats)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchChats, user])

  const filtered = chats.filter(c => c.otherUser?.full_name?.toLowerCase().includes(search.toLowerCase()) || c.otherUser?.phone?.includes(search))

  return (
    <div className="w-full md:w-80 lg:w-96 shrink-0 bg-whatsapp-panel border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold mb-3">Chats</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-whatsapp-text-secondary" size={18}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats" className="input pl-10"/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filtered.length ? filtered.map(chat => (
          <button key={chat.id} onClick={() => onSelectChat(chat)} className={`w-full text-left p-3 flex items-center gap-3 hover:bg-whatsapp-hover border-b border-gray-800/50 ${selectedChatId === chat.id ? 'bg-whatsapp-hover' : ''}`}>
            <div className="avatar">
              {chat.otherUser?.is_group ? <UsersRound size={20}/> : (chat.otherUser?.full_name?.[0]?.toUpperCase() || '?')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2">
                <h3 className="font-medium truncate">{chat.otherUser?.full_name || 'Unknown'}</h3>
                {chat.lastMessage && <span className="text-[10px] text-whatsapp-text-secondary whitespace-nowrap">{formatDistanceToNow(new Date(chat.lastMessage.created_at), { addSuffix: false })}</span>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-whatsapp-text-secondary truncate">{chat.lastMessage?.content || 'Start a conversation'}</p>
                {chat.unreadCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-whatsapp-green text-white text-[10px] flex items-center justify-center">{chat.unreadCount}</span>}
              </div>
            </div>
          </button>
        )) : <div className="p-8 text-center text-whatsapp-text-secondary">No chats yet. Open Contacts to start one.</div>}
      </div>
    </div>
  )
}
