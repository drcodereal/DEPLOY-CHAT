import { useState } from 'react'
import { X, UserPlus, Smartphone, Loader2 } from 'lucide-react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'

const normalize = (phone) => phone.trim().replace(/[^\d+]/g, '')

export default function AddContactModal({ onClose, onSaved }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [imported, setImported] = useState(0)
  const contactPickerSupported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in navigator.contacts

  const upsertDeviceContact = async (contactName, rawPhone) => {
    const cleanPhone = normalize(rawPhone)
    if (!cleanPhone) return
    const { data: matchedProfile } = await supabase.from('profiles').select('id').eq('phone', cleanPhone).maybeSingle()
    await supabase.from('device_contacts').upsert({
      owner_id: user.id,
      phone: cleanPhone,
      name: contactName || cleanPhone,
      matched_profile_id: matchedProfile?.id || null,
    }, { onConflict: 'owner_id,phone' })
  }

  const handleAddOne = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !phone.trim()) { setError('Name and number dono zaroori hain'); return }
    setSaving(true)
    try {
      await upsertDeviceContact(name.trim(), phone)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Contact save nahi hua')
    } finally {
      setSaving(false)
    }
  }

  const handleImportFromPhone = async () => {
    setError('')
    setImporting(true)
    try {
      const props = ['name', 'tel']
      const contacts = await navigator.contacts.select(props, { multiple: true })
      let count = 0
      for (const c of contacts) {
        const contactName = Array.isArray(c.name) ? c.name[0] : c.name
        const tel = Array.isArray(c.tel) ? c.tel[0] : c.tel
        if (!tel) continue
        await upsertDeviceContact(contactName, tel)
        count += 1
      }
      setImported(count)
      onSaved?.()
    } catch (err) {
      if (err?.name !== 'AbortError') setError('Contacts import nahi ho sakay. Manually add karein.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold text-lg">New Contact</h3>
          <button onClick={onClose} className="icon-btn"><X size={20}/></button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {contactPickerSupported && (
            <button
              onClick={handleImportFromPhone}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 btn-secondary"
            >
              {importing ? <Loader2 size={16} className="animate-spin"/> : <Smartphone size={16}/>}
              {importing ? 'Importing…' : 'Import contacts from phone'}
            </button>
          )}
          {imported > 0 && <p className="text-xs text-whatsapp-green text-center">{imported} contact(s) imported</p>}

          <div className="flex items-center gap-2 text-xs text-whatsapp-text-secondary">
            <div className="flex-1 h-px bg-gray-700"/>or add manually<div className="flex-1 h-px bg-gray-700"/>
          </div>

          <form onSubmit={handleAddOne} className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Contact name" className="input"/>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number (with country code)" className="input"/>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <UserPlus size={16}/>}
              Save contact
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
