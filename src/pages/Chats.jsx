import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import CallScreen from '../components/CallScreen'
import CallsList from '../components/CallsList'
import Contacts from './Contacts'
import { useWebRTC } from '../hooks/useWebRTC'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../utils/supabaseClient'

const NOTIFICATION_KEY = 'chatapp_notifications_enabled'

export default function Chats() {
  const { user, updateOnlineStatus } = useAuth()
  const [tab, setTab] = useState('chats')
  const [chat, setChat] = useState(null)
  const [mobileChat, setMobileChat] = useState(false)
  const rtc = useWebRTC(user?.id)
  const notifiedIds = useRef(new Set())

  useEffect(() => {
    if (!user) return
    updateOnlineStatus(true)
    const onUnload = () => updateOnlineStatus(false)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      updateOnlineStatus(false)
    }
  }, [user?.id])

  // Browser notifications for incoming messages while the user is away
  // from the ChatApp tab/window. Vercel's HTTPS deployment supports this API.
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return

    const channel = supabase.channel(`notifications:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async payload => {
        const message = payload.new
        if (!message?.id || message.sender_id === user.id || notifiedIds.current.has(message.id)) return
        notifiedIds.current.add(message.id)
        if (notifiedIds.current.size > 200) {
          const first = notifiedIds.current.values().next().value
          notifiedIds.current.delete(first)
        }

        const notificationsEnabled = localStorage.getItem(NOTIFICATION_KEY) !== 'false'
        const away = document.visibilityState !== 'visible' || !document.hasFocus()
        if (!notificationsEnabled || !away || !('Notification' in window)) return

        if (Notification.permission === 'default') {
          try { await Notification.requestPermission() } catch {}
        }
        if (Notification.permission !== 'granted') return

        let senderName = 'New message'
        const { data: sender } = await supabase.from('profiles').select('full_name').eq('id', message.sender_id).maybeSingle()
        if (sender?.full_name) senderName = sender.full_name

        const notification = new Notification(senderName, {
          body: message.content || 'You received a new message.',
          tag: `chatapp-${message.conversation_id}`,
          icon: '/favicon.svg',
        })
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  return <div className="h-screen flex bg-whatsapp-dark overflow-hidden">
    <CallScreen {...rtc} onAccept={rtc.acceptCall} onReject={rtc.rejectCall} onEnd={rtc.endCall}/>
    <Navbar activeTab={tab} setActiveTab={setTab}/>
    {tab === 'chats' && <><div className={`${mobileChat ? 'hidden md:flex' : 'flex'} h-full`}><ChatList onSelectChat={c => { setChat(c); setMobileChat(true) }} selectedChatId={chat?.id}/></div><div className={`${mobileChat ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}><ChatWindow chat={chat} onBack={() => { setMobileChat(false); setChat(null) }} onStartCall={type => chat?.otherUser?.id && rtc.startCall(chat.otherUser.id, type)}/></div></>}
    {tab === 'calls' && <CallsList/>}
    {tab === 'contacts' && <Contacts onStartChat={c => { setChat(c); setTab('chats'); setMobileChat(true) }}/>}
  </div>
}
