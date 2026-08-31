import { X, Settings as SettingsIcon, Bell, BellOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const NOTIFICATION_KEY = 'chatapp_notifications_enabled'

export default function SettingsModal({ onClose }) {
  const { profile, setReadReceipts } = useAuth()
  const readReceiptsOn = profile?.read_receipts_enabled !== false
  const [notificationsOn, setNotificationsOn] = useState(() => localStorage.getItem(NOTIFICATION_KEY) !== 'false')
  const [permission, setPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported')

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      const enabled = result === 'granted'
      setNotificationsOn(enabled)
      localStorage.setItem(NOTIFICATION_KEY, String(enabled))
    } catch {
      setNotificationsOn(false)
      localStorage.setItem(NOTIFICATION_KEY, 'false')
    }
  }

  const disableNotifications = () => {
    setNotificationsOn(false)
    localStorage.setItem(NOTIFICATION_KEY, 'false')
  }

  useEffect(() => {
    if (localStorage.getItem(NOTIFICATION_KEY) === null) {
      localStorage.setItem(NOTIFICATION_KEY, 'true')
    }
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold text-lg flex items-center gap-2"><SettingsIcon size={18}/> Settings & Privacy</h3>
          <button onClick={onClose} className="icon-btn"><X size={20}/></button>
        </div>

        <div className="p-4 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Message notifications</p>
              <p className="text-xs text-whatsapp-text-secondary mt-1">
                Get a browser notification when a new message arrives while you're away from ChatApp.
              </p>
              {permission === 'denied' && <p className="text-xs text-red-400 mt-1">Notifications are blocked by your browser. Allow them in the browser's site settings.</p>}
              {permission === 'unsupported' && <p className="text-xs text-red-400 mt-1">This browser does not support notifications.</p>}
            </div>
            {notificationsOn && permission === 'granted' ? (
              <button onClick={disableNotifications} className="icon-btn" title="Disable notifications"><Bell size={21}/></button>
            ) : (
              <button onClick={enableNotifications} className="btn-primary flex items-center gap-2" disabled={permission === 'unsupported'}>
                <BellOff size={16}/> Enable
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-700">
            <div>
              <p className="font-medium">Read receipts</p>
              <p className="text-xs text-whatsapp-text-secondary mt-1">
                Blue ticks show when your message has been read. Incoming unread badges are cleared whenever you open the conversation.
              </p>
            </div>
            <button
              onClick={() => setReadReceipts(!readReceiptsOn)}
              className="toggle-track"
              style={{ backgroundColor: readReceiptsOn ? '#00a884' : '#4b5563' }}
              aria-pressed={readReceiptsOn}
            >
              <span className="toggle-thumb" style={{ transform: readReceiptsOn ? 'translateX(22px)' : 'translateX(2px)' }}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
