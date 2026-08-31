import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react'

const sections = {
  terms: {
    title: 'Terms & Conditions',
    icon: FileText,
    intro: 'Please read these terms before using ChatApp.',
    items: [
      ['Acceptance of terms', 'By creating an account or using ChatApp, you agree to use the service lawfully and responsibly. If you do not agree, do not use the service.'],
      ['Accounts', 'You are responsible for the accuracy of information you provide and for keeping your password confidential. Do not share your account or impersonate another person.'],
      ['Messaging & conduct', 'Do not use ChatApp to send unlawful, threatening, abusive, fraudulent, or harmful content. You are responsible for the content you send.'],
      ['Availability', 'ChatApp is provided on an availability basis. Features may be changed, updated, suspended, or discontinued when necessary for maintenance, security, or improvements.'],
      ['Calls & permissions', 'Voice and video calling may require browser access to your microphone and camera. You control these permissions through your browser.'],
      ['Security', 'We use reasonable technical measures to protect the service, but no internet service can guarantee absolute security. Never share sensitive credentials in messages.'],
      ['Termination', 'Access may be suspended or terminated for serious misuse, security concerns, or violation of these terms.'],
      ['Changes', 'These terms may be updated from time to time. Continued use after an update means you accept the revised terms.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    icon: ShieldCheck,
    intro: 'This policy explains the information used to provide ChatApp.',
    items: [
      ['Information we use', 'ChatApp may store account details such as your display name, phone number, profile information, messages, conversations, and call-related records needed to provide the service.'],
      ['Authentication', 'Your password is handled by the authentication provider and is not stored as plain text in the ChatApp interface.'],
      ['Messages', 'Messages are stored so they can be delivered and synchronized between your devices and contacts. Only use ChatApp for information you are comfortable storing on an online service.'],
      ['Notifications', 'If you enable browser notifications, your browser may display incoming-message alerts while you are away from the ChatApp tab. Notification permission is controlled by you and can be revoked in browser settings.'],
      ['Device permissions', 'Camera and microphone access is requested only for calling features and is controlled by your browser.'],
      ['Cookies & local storage', 'The app uses browser storage for authentication sessions and notification preferences. These are necessary for keeping you signed in and remembering your choices.'],
      ['Your choices', 'You can log out, change available privacy settings, disable notifications, or stop using the service at any time.'],
      ['Policy changes', 'We may update this policy when the service changes. The latest version will be available on this page.'],
    ],
  },
}

export default function Legal() {
  const [params] = useSearchParams()
  const type = params.get('page') === 'privacy' ? 'privacy' : 'terms'
  const section = sections[type]
  const Icon = section.icon

  return (
    <div className="min-h-screen bg-whatsapp-dark text-whatsapp-text">
      <header className="sticky top-0 z-10 bg-whatsapp-panel/95 backdrop-blur border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/login" className="icon-btn flex items-center gap-2" title="Back to login">
            <ArrowLeft size={19}/> <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex gap-2 text-sm">
            <Link to="/legal?page=terms" className={`px-3 py-2 rounded-lg ${type === 'terms' ? 'bg-whatsapp-green text-white' : 'hover:bg-whatsapp-hover'}`}>Terms</Link>
            <Link to="/legal?page=privacy" className={`px-3 py-2 rounded-lg ${type === 'privacy' ? 'bg-whatsapp-green text-white' : 'hover:bg-whatsapp-hover'}`}>Privacy</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-whatsapp-panel rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-whatsapp-green/20 text-whatsapp-green flex items-center justify-center mb-4">
              <Icon size={25}/>
            </div>
            <h1 className="text-3xl font-bold text-white">{section.title}</h1>
            <p className="text-whatsapp-text-secondary mt-2">{section.intro}</p>
            <p className="text-xs text-whatsapp-text-secondary mt-3">Last updated: YESTERDAY</p>
          </div>

          <div className="p-6 sm:p-8 space-y-7">
            {section.items.map(([title, text]) => (
              <section key={title}>
                <h2 className="font-semibold text-lg text-white mb-2">{title}</h2>
                <p className="text-sm leading-7 text-whatsapp-text-secondary">{text}</p>
              </section>
            ))}
          </div>
        </div>

        <footer className="text-center text-xs text-whatsapp-text-secondary py-8">
          ©  ChatApp. All rights reserved.
        </footer>
      </main>
    </div>
  )
}
