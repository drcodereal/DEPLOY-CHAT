import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { MessageCircle, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading, signUp, signIn } = useAuth()
  const navigate = useNavigate()

  // Already signed in? Don't show the register form (also covers the
  // back-button case).
  if (!authLoading && user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { data, error } = await signUp(phone, password, fullName)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // New accounts are auto-confirmed in this app, so signUp already leaves
    // the user logged in. Make sure of it (and cover any edge case where a
    // session wasn't returned) so a brand-new user lands straight in the
    // app instead of being sent back to the login form.
    if (!data?.session) {
      const { error: signInError } = await signIn(phone, password)
      if (signInError) {
        setError('Account created. Please log in.')
        setLoading(false)
        navigate('/login', { replace: true })
        return
      }
    }

    setLoading(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-whatsapp-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-whatsapp-green mx-auto mb-4 flex items-center justify-center">
            <MessageCircle size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ChatApp</h1>
          <p className="text-whatsapp-text-secondary">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-whatsapp-text-secondary mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-whatsapp-panel text-whatsapp-text rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
              required
            />
          </div>

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
                placeholder="Min 6 characters"
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

          <div>
            <label className="block text-sm text-whatsapp-text-secondary mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full bg-whatsapp-panel text-whatsapp-text rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-glow w-full bg-whatsapp-green text-white font-semibold py-3 rounded-lg hover:bg-whatsapp-green-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-whatsapp-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-whatsapp-green hover:underline">
            Login
          </Link>
        </p>

        <div className="text-center text-xs text-whatsapp-text-secondary mt-6 space-x-3">
          <Link to="/legal?page=terms" className="hover:text-whatsapp-green hover:underline">Terms & Conditions</Link>
          <span>•</span>
          <Link to="/legal?page=privacy" className="hover:text-whatsapp-green hover:underline">Privacy Policy</Link>
          <p className="mt-2">© ChatApp. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
