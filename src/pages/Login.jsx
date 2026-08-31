import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { MessageCircle, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading, signIn } = useAuth()
  const navigate = useNavigate()

  // If the user is already signed in (e.g. they hit the browser Back button
  // and landed back on /login), send them straight to the app instead of
  // showing the login form again — that's what made it *look* like they'd
  // been logged out.
  if (!authLoading && user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(phone, password)

    if (error) {
      setError(error.message)
    } else {
      navigate('/', { replace: true })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-whatsapp-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-whatsapp-green mx-auto mb-4 flex items-center justify-center">
            <MessageCircle size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ChatApp</h1>
          <p className="text-whatsapp-text-secondary">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-whatsapp-text-secondary mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full bg-whatsapp-panel text-whatsapp-text rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-whatsapp-text-secondary mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-whatsapp-panel text-whatsapp-text rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-whatsapp-text-secondary"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-glow w-full bg-whatsapp-green text-white font-semibold py-3 rounded-lg hover:bg-whatsapp-green-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-whatsapp-text-secondary mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-whatsapp-green hover:underline">
            Register
          </Link>
        </p>

        <div className="text-center text-xs text-whatsapp-text-secondary mt-6 space-x-3">
          <Link to="/legal?page=terms" className="hover:text-whatsapp-green hover:underline">Terms & Conditions</Link>
          <span>•</span>
          <Link to="/legal?page=privacy" className="hover:text-whatsapp-green hover:underline">Privacy Policy</Link>
          <p className="mt-2">© 2026 ChatApp. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
