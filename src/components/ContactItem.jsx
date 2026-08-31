import { MessageCircle, Share2, UserPlus, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function ContactItem({ contact, isOnApp, onStartChat }) {
  const { user } = useAuth()
  const [invited, setInvited] = useState(false)
  const [starting, setStarting] = useState(false)

  const startChat = async () => {
    if (!isOnApp || starting) return
    setStarting(true)
    try {
      const a = user.id < contact.id ? user.id : contact.id
      const b = user.id < contact.id ? contact.id : user.id

      // Look for an existing 1:1 conversation between these two users first.
      const { data: existing, error: lookupError } = await supabase
        .from('conversations').select('*')
        .eq('is_group', false).eq('user1_id', a).eq('user2_id', b)
        .maybeSingle()
      if (lookupError) throw lookupError
      if (existing) { onStartChat(existing); return }

      // None yet — create it.
      const { data, error } = await supabase.from('conversations')
        .insert({ user1_id: a, user2_id: b, is_group: false })
        .select().single()

      if (!error) { onStartChat(data); return }

      if (error.code === '23505') {
        // Someone else (e.g. the other user, in a race) created it first — fetch it.
        const { data: retry, error: retryError } = await supabase
          .from('conversations').select('*')
          .eq('is_group', false).eq('user1_id', a).eq('user2_id', b)
          .single()
        if (retryError) throw retryError
        if (retry) { onStartChat(retry); return }
      }
      throw error
    } catch (err) {
      console.error('Could not start chat:', err)
      alert(err?.message || 'Chat start nahi ho saka. Dobara try karein.')
    } finally {
      setStarting(false)
    }
  }

  const invite = async () => {
    const code = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()
    const { error } = await supabase.from('invites').insert({ inviter_id: user.id, phone_number: contact.phone, invite_code: code })
    if (!error) {
      setInvited(true)
      const text = `Join me on ChatApp: ${window.location.origin}/join?code=${code}`
      window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank')
    } else {
      console.error('Could not send invite:', error)
      alert(error.message || 'Invite bhejne mein masla hua.')
    }
  }

  const name = contact.displayName || contact.full_name || contact.name || 'Unknown'
  const showPhone = isOnApp ? contact.phoneVisible : true

  return (
    <div
      className={`flex items-center gap-3 p-3 hover:bg-whatsapp-hover border-b border-gray-800/50 ${isOnApp ? 'cursor-pointer' : ''}`}
      onClick={isOnApp ? startChat : undefined}
      role={isOnApp ? 'button' : undefined}
    >
      <div className="avatar">{name[0]?.toUpperCase()}</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{name}</h3>
        <p className="text-sm text-whatsapp-text-secondary truncate flex items-center gap-1">
          {isOnApp
            ? (showPhone ? contact.phone : contact.status || 'On ChatApp')
            : contact.phone}
          {isOnApp && !showPhone && (
            <span className="inline-flex items-center gap-1 text-[10px] text-whatsapp-text-secondary/70" title="Number hidden — save this contact to see it">
              <EyeOff size={11}/> number hidden
            </span>
          )}
        </p>
      </div>
      {isOnApp ? (
        <button onClick={e => { e.stopPropagation(); startChat() }} disabled={starting} className="icon-btn text-whatsapp-green disabled:opacity-50" title="Chat">
          {starting ? <Loader2 size={20} className="animate-spin"/> : <MessageCircle size={20}/>}
        </button>
      ) : (
        <button onClick={e => { e.stopPropagation(); invite() }} disabled={invited} className="flex items-center gap-1 px-3 py-1.5 bg-whatsapp-green rounded-full text-white text-xs disabled:opacity-50">
          {invited ? <><UserPlus size={14}/> Invited</> : <><Share2 size={14}/> Invite</>}
        </button>
      )}
    </div>
  )
}

