import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

export const AuthContext = createContext(null)

const normalizePhone = (phone) => phone.trim().replace(/[^\d+]/g, '')
const authEmail = (phone) => `${normalizePhone(phone).replace('+', '')}@chatapp.local`

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (id) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    if (!error) setProfile(data)
    return data
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      const currentUser = data.session?.user ?? null
      setUser(currentUser)
      if (currentUser) await fetchProfile(currentUser.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) await fetchProfile(currentUser.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (phone, password, fullName) => {
    const cleanPhone = normalizePhone(phone)
    return supabase.auth.signUp({
      email: authEmail(cleanPhone),
      password,
      options: { data: { phone: cleanPhone, full_name: fullName.trim() } },
    })
  }

  const signIn = async (phone, password) => {
    return supabase.auth.signInWithPassword({ email: authEmail(phone), password })
  }

  const signOut = async () => {
    await updateOnlineStatus(false)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const updateOnlineStatus = async (isOnline) => {
    if (!user) return
    await supabase.from('profiles').update({ is_online: isOnline, last_seen: new Date().toISOString() }).eq('id', user.id)
  }

  const setReadReceipts = async (enabled) => {
    if (!user) return
    const { error } = await supabase.from('profiles').update({ read_receipts_enabled: enabled }).eq('id', user.id)
    if (!error) setProfile(prev => prev ? { ...prev, read_receipts_enabled: enabled } : prev)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateOnlineStatus, fetchProfile, setReadReceipts }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
