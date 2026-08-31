import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Chats from './pages/Chats'
import Legal from './pages/Legal'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-whatsapp-dark flex items-center justify-center"><div className="w-10 h-10 border-4 border-whatsapp-green border-t-transparent rounded-full animate-spin"/></div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return <AuthProvider><BrowserRouter><Routes><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/" element={<PrivateRoute><Chats/></PrivateRoute>}/><Route path="/legal" element={<Legal/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></BrowserRouter></AuthProvider>
}
