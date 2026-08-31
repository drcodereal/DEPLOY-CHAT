import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Users, UserPlus, UsersRound } from 'lucide-react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import ContactItem from '../components/ContactItem'
import AddContactModal from '../components/AddContactModal'
import NewGroupModal from '../components/NewGroupModal'

export default function Contacts({ onStartChat }) {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [deviceContacts, setDeviceContacts] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showAddContact, setShowAddContact] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)

  const load = useCallback(async () => {
    const [{ data: allProfiles }, { data: myDeviceContacts }] = await Promise.all([
      supabase.from('profiles').select('*').neq('id', user.id).order('full_name'),
      supabase.from('device_contacts').select('*').eq('owner_id', user.id),
    ])
    setProfiles(allProfiles || [])
    setDeviceContacts(myDeviceContacts || [])
  }, [user])

  useEffect(() => { if (user) load() }, [user, load])

  // Every app user shows up in the global directory. If we have them saved in
  // our own phone-book (device_contacts), we show the name we saved them under
  // plus their real number. If we don't know them, we still show them (so
  // people can discover and chat with anyone on the app) but only by their
  // app display name — their phone number stays hidden until we save it.
  const savedByProfileId = useMemo(() => {
    const map = new Map()
    for (const dc of deviceContacts) if (dc.matched_profile_id) map.set(dc.matched_profile_id, dc)
    return map
  }, [deviceContacts])

  const appUsers = useMemo(() => profiles.map(p => {
    const saved = savedByProfileId.get(p.id)
    return {
      ...p,
      displayName: saved?.name || p.full_name,
      phoneVisible: Boolean(saved),
      isSaved: Boolean(saved),
    }
  }), [profiles, savedByProfileId])

  // Phone-book entries that don't correspond to any registered app user yet —
  // these are the people we can invite.
  const inviteable = useMemo(
    () => deviceContacts.filter(dc => !dc.matched_profile_id),
    [deviceContacts],
  )

  const filteredUsers = useMemo(() => appUsers.filter(u => {
    const q = search.toLowerCase()
    const matches = !q || u.displayName?.toLowerCase().includes(q) || (u.phoneVisible && u.phone?.includes(search))
    return matches && (filter === 'all' || (filter === 'online' ? u.is_online : filter === 'saved' ? u.isSaved : true))
  }), [appUsers, search, filter])

  const filteredInvites = useMemo(
    () => inviteable.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)),
    [inviteable, search],
  )

  return (
    <div className="flex-1 bg-whatsapp-chat-bg flex flex-col min-w-0">
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Contacts</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowNewGroup(true)} className="icon-btn" title="New group"><UsersRound size={20}/></button>
            <button onClick={() => setShowAddContact(true)} className="icon-btn" title="New contact"><UserPlus size={20}/></button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-whatsapp-text-secondary" size={18}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people" className="input pl-10"/>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'filter-active' : 'filter-btn'}>All</button>
          <button onClick={() => setFilter('saved')} className={filter === 'saved' ? 'filter-active' : 'filter-btn'}>My contacts</button>
          <button onClick={() => setFilter('online')} className={filter === 'online' ? 'filter-active' : 'filter-btn'}>Online</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredUsers.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase text-whatsapp-text-secondary">On ChatApp</p>
            {filteredUsers.map(c => (
              <ContactItem
                key={c.id}
                contact={c}
                isOnApp
                onStartChat={async conv => onStartChat({ ...conv, otherUser: c })}
              />
            ))}
          </div>
        )}

        {filteredInvites.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase text-whatsapp-text-secondary">Invite to ChatApp</p>
            {filteredInvites.map(c => (
              <ContactItem key={c.id} contact={{ ...c, displayName: c.name, phoneVisible: true }} isOnApp={false}/>
            ))}
          </div>
        )}

        {!filteredUsers.length && !filteredInvites.length && (
          <div className="h-64 flex flex-col items-center justify-center text-whatsapp-text-secondary">
            <Users size={45} className="mb-3 opacity-40"/>
            <p>No contacts found</p>
          </div>
        )}
      </div>

      {showAddContact && <AddContactModal onClose={() => setShowAddContact(false)} onSaved={load}/>}
      {showNewGroup && (
        <NewGroupModal
          people={appUsers}
          onClose={() => setShowNewGroup(false)}
          onCreated={conv => onStartChat(conv)}
        />
      )}
    </div>
  )
}
