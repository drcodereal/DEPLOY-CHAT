import { useEffect, useState } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react'

export default function CallScreen({ callState, callType, callerInfo, localStream, remoteStream, onAccept, onReject, onEnd }) {
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => { setSeconds(0); setMuted(false); setVideoOff(false) }, [callState])
  useEffect(() => { if (callState !== 'connected') return; const id = setInterval(() => setSeconds(s => s + 1), 1000); return () => clearInterval(id) }, [callState])
  if (callState === 'idle') return null
  const name = callerInfo?.full_name || 'Calling…'
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return <div className="fixed inset-0 z-50 bg-black flex flex-col">
    <div className="flex-1 relative flex items-center justify-center">
      {callType === 'video' && remoteStream && callState === 'connected' ? <video autoPlay playsInline ref={el => { if (el) el.srcObject = remoteStream }} className="w-full h-full object-cover"/> : <div className="text-center"><div className="avatar avatar-lg mx-auto mb-4">{name[0]?.toUpperCase()}</div><h2 className="text-2xl font-semibold text-white">{name}</h2><p className="text-gray-400 mt-2">{callState === 'calling' ? 'Calling…' : callState === 'receiving' ? 'Incoming call' : time}</p></div>}
      {callType === 'video' && localStream && <video autoPlay muted playsInline ref={el => { if (el) el.srcObject = localStream }} className="absolute top-4 right-4 w-32 h-44 object-cover rounded-xl border border-white/20"/>}
    </div>
    <div className="h-28 flex items-center justify-center gap-5">
      {callState === 'receiving' ? <><button onClick={onReject} className="call-btn bg-red-500"><PhoneOff/></button><button onClick={onAccept} className="call-btn bg-green-500"><Phone/></button></> : <><button onClick={() => { const next = !muted; setMuted(next); localStream?.getAudioTracks().forEach(t => { t.enabled = !next }) }} className="call-btn bg-gray-700">{muted ? <MicOff/> : <Mic/>}</button>{callType === 'video' && <button onClick={() => { const next = !videoOff; setVideoOff(next); localStream?.getVideoTracks().forEach(t => { t.enabled = !next }) }} className="call-btn bg-gray-700">{videoOff ? <VideoOff/> : <Video/>}</button>}<button onClick={onEnd} className="call-btn bg-red-500"><PhoneOff/></button></>}
    </div>
  </div>
}
