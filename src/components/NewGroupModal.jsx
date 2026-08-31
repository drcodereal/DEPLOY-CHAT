import { useState } from 'react'
import { X, Users, Loader2, Check } from 'lucide-react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function NewGroupModal({ people, onClose, onCreated }) {
  const { user } = useAuth()
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const filtered = people.filter(p => p.displayName.toLowerCase().includes(search.toLowerCase()))

  const handleCreate = async () => {
    setError('')
    if (!groupName.trim()) { setError('Group ka naam likhein'); return }
    if (selected.length < 1) { setError('Kam se kam 1 member select karein'); return }
    setCreating(true)
    try {
      const { data: conv, error: convError } = await supabase.from('conversations').insert({
        is_group: true,
        group_name: groupName.trim(),
        created_by: user.id,
        user1_id: null,
        user2_id: null,
      }).select().single()
      if (convError) throw convError

      const members = [user.id, ...selected].map(id => ({
        conversation_id: conv.id,
        user_id: id,
        is_admin: id === user.id,
      }))
      const { error: memberError } = await supabase.from('group_members').insert(members)
      if (memberError) throw memberError

      onCreated?.({ ...conv, otherUser: { full_name: conv.group_name, is_group: true } })
      onClose()
    } catch (err) {
      setError(err.message || 'Group create nahi ho saka')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Users size={18}/> New Group</h3>
          <button onClick={onClose} className="icon-btn"><X size={20}/></button>
        </div>

        <div className="p-4 space-y-3 border-b border-gray-700">
          <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" className="input"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members" className="input"/>
          {selected.length > 0 && <p className="text-xs text-whatsapp-text-secondary">{selected.length} member(s) selected</p>}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filtered.length ? filtered.map(p => (
            <button key={p.id} onClick={() => toggle(p.id)} className="w-full flex items-center gap-3 p-3 hover:bg-whatsapp-hover text-left">
              <div className="avatar">{p.displayName?.[0]?.toUpperCase() || '?'}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{p.displayName}</h4>
                {p.phoneVisible && <p className="text-xs text-whatsapp-text-secondary truncate">{p.phone}</p>}
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected.includes(p.id) ? 'bg-whatsapp-green border-whatsapp-green' : 'border-gray-500'}`}>
                {selected.includes(p.id) && <Check size={13} className="text-white"/>}
              </div>
            </button>
          )) : <p className="p-6 text-center text-sm text-whatsapp-text-secondary">No one to show</p>}
        </div>

        <div className="p-4 border-t border-gray-700">
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <button onClick={handleCreate} disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">
            {creating ? <Loader2 size={16} className="animate-spin"/> : <Users size={16}/>}
            Create group
          </button>
        </div>
      </div>
    </div>
  )
}
