import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CallsList() {
  const { user } = useAuth()
  const [calls, setCalls] = useState([])

  useEffect(() => {
    if (!user) return
    fetchCalls()
  }, [user])

  const fetchCalls = async () => {
    const { data } = await supabase
      .from('calls')
      .select('*')
      .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('started_at', { ascending: false })

    if (!data) return

    const callsWithUsers = await Promise.all(
      data.map(async (call) => {
        const otherId = call.caller_id === user.id ? call.receiver_id : call.caller_id
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', otherId)
          .single()

        return {
          ...call,
          otherUser: userData,
          isOutgoing: call.caller_id === user.id,
        }
      })
    )

    setCalls(callsWithUsers)
  }

  const getCallIcon = (call) => {
    if (call.status === 'missed') return <PhoneMissed size={18} className="text-red-400" />
    if (call.isOutgoing) return <PhoneOutgoing size={18} className="text-whatsapp-green" />
    return <PhoneIncoming size={18} className="text-whatsapp-green" />
  }

  const formatDuration = (seconds) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex-1 bg-whatsapp-chat-bg overflow-y-auto scrollbar-hide">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Calls</h2>
      </div>

      {calls.map(call => (
        <div key={call.id} className="flex items-center gap-3 p-3 hover:bg-whatsapp-hover transition-colors">
          <div className="w-12 h-12 rounded-full bg-whatsapp-green flex items-center justify-center text-white font-bold shrink-0">
            {call.otherUser?.full_name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{call.otherUser?.full_name}</h3>
            <div className="flex items-center gap-2 text-sm text-whatsapp-text-secondary">
              {getCallIcon(call)}
              <span>
                {call.isOutgoing ? 'Outgoing' : 'Incoming'} 
                {call.call_type === 'video' && ' video'} call
                {call.status === 'missed' && ' (missed)'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-whatsapp-text-secondary">
              {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
            </p>
            {call.duration_seconds > 0 && (
              <p className="text-xs text-whatsapp-text-secondary">
                {formatDuration(call.duration_seconds)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
