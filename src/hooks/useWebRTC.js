import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function useWebRTC(userId) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [callState, setCallState] = useState('idle')
  const [callType, setCallType] = useState(null)
  const [callerInfo, setCallerInfo] = useState(null)
  const pcRef = useRef(null)
  const peerIdRef = useRef(null)
  const pendingCandidates = useRef([])
  const activeCallId = useRef(null)

  const sendSignal = useCallback(async (receiverId, type, payload = {}) => {
    const { error } = await supabase.from('call_signals').insert({ sender_id: userId, receiver_id: receiverId, type, payload })
    if (error) console.error('Call signal error:', error)
  }, [userId])

  const closePeer = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    localStream?.getTracks().forEach(t => t.stop())
    setLocalStream(null)
    setRemoteStream(null)
  }, [localStream])

  const handleSignal = useCallback(async (signal) => {
    const { sender_id, type, payload } = signal
    if (type === 'offer') {
      if (pcRef.current || callState !== 'idle') {
        await sendSignal(sender_id, 'busy')
        return
      }
      peerIdRef.current = sender_id
      const { data: caller } = await supabase.from('profiles').select('id,full_name,avatar_url,phone').eq('id', sender_id).single()
      setCallerInfo(caller || { id: sender_id, full_name: 'Unknown user' })
      setCallType(payload.call_type)
      setCallState('receiving')
      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc
      pc.ontrack = e => setRemoteStream(e.streams[0])
      pc.onicecandidate = e => e.candidate && sendSignal(sender_id, 'ice-candidate', { candidate: e.candidate })
      await pc.setRemoteDescription(payload.sdp)
      for (const c of pendingCandidates.current) await pc.addIceCandidate(c).catch(() => {})
      pendingCandidates.current = []
    }

    if (type === 'answer' && pcRef.current) {
      await pcRef.current.setRemoteDescription(payload.sdp)
      setCallState('connected')
    }

    if (type === 'ice-candidate') {
      const candidate = new RTCIceCandidate(payload.candidate)
      if (pcRef.current?.remoteDescription) await pcRef.current.addIceCandidate(candidate).catch(() => {})
      else pendingCandidates.current.push(candidate)
    }

    if (type === 'call-ended' || type === 'busy') {
      closePeer()
      setCallState('idle')
      setCallType(null)
      setCallerInfo(null)
      peerIdRef.current = null
    }
  }, [callState, closePeer, sendSignal])

  useEffect(() => {
    if (!userId) return
    const channel = supabase.channel(`call-signals:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `receiver_id=eq.${userId}` }, ({ new: signal }) => handleSignal(signal))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, handleSignal])

  const startCall = async (receiverId, type) => {
    try {
      peerIdRef.current = receiverId
      setCallType(type)
      setCallState('calling')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' })
      setLocalStream(stream)
      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
      pc.ontrack = e => setRemoteStream(e.streams[0])
      pc.onicecandidate = e => e.candidate && sendSignal(receiverId, 'ice-candidate', { candidate: e.candidate })
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await sendSignal(receiverId, 'offer', { sdp: offer, call_type: type })
      const { data } = await supabase.from('calls').insert({ caller_id: userId, receiver_id: receiverId, call_type: type, status: 'ringing' }).select().single()
      activeCallId.current = data?.id || null
    } catch (error) {
      console.error(error)
      closePeer()
      setCallState('idle')
      alert(error.name === 'NotAllowedError' ? 'Camera/microphone permission was denied.' : 'Could not start the call.')
    }
  }

  const acceptCall = async () => {
    if (!pcRef.current || !peerIdRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' })
      setLocalStream(stream)
      stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream))
      const answer = await pcRef.current.createAnswer()
      await pcRef.current.setLocalDescription(answer)
      await sendSignal(peerIdRef.current, 'answer', { sdp: answer })
      setCallState('connected')
      const { data } = await supabase.from('calls').insert({ caller_id: peerIdRef.current, receiver_id: userId, call_type: callType, status: 'answered' }).select().single()
      activeCallId.current = data?.id || null
    } catch (error) {
      console.error(error)
      await rejectCall()
    }
  }

  const rejectCall = async () => {
    if (peerIdRef.current) await sendSignal(peerIdRef.current, 'call-ended')
    closePeer(); setCallState('idle'); setCallType(null); setCallerInfo(null); peerIdRef.current = null
  }

  const endCall = async () => {
    const peerId = peerIdRef.current
    if (peerId) await sendSignal(peerId, 'call-ended')
    if (activeCallId.current) await supabase.from('calls').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', activeCallId.current)
    activeCallId.current = null
    closePeer(); setCallState('idle'); setCallType(null); setCallerInfo(null); peerIdRef.current = null
  }

  useEffect(() => () => { closePeer() }, [closePeer])

  return { localStream, remoteStream, callState, callType, callerInfo, startCall, acceptCall, rejectCall, endCall }
}
