import { MessageCircle, Phone, Users, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import SettingsModal from './SettingsModal'

export default function Navbar({ activeTab, setActiveTab }) {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const tabs = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
  ]

  return (
    <div className="w-20 bg-whatsapp-panel flex flex-col items-center py-4 border-r border-gray-700">
      <div className="mb-6">
        <div className="w-10 h-10 rounded-full bg-whatsapp-green flex items-center justify-center text-white font-bold">
          {profile?.full_name?.[0] || 'U'}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3 rounded-xl transition-colors ${
              activeTab === tab.id 
                ? 'bg-whatsapp-hover text-whatsapp-green' 
                : 'text-whatsapp-text-secondary hover:bg-whatsapp-hover'
            }`}
            title={tab.label}
          >
            <tab.icon size={22} />
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowSettings(true)}
        className="p-3 text-whatsapp-text-secondary hover:bg-whatsapp-hover rounded-xl transition-colors"
        title="Privacy settings"
      >
        <Settings size={22} />
      </button>

      <button
        onClick={handleLogout}
        className="p-3 text-whatsapp-text-secondary hover:bg-whatsapp-hover rounded-xl transition-colors"
        title="Logout"
      >
        <LogOut size={22} />
      </button>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)}/>}
    </div>
  )
}
