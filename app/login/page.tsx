'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flower2, KeyRound, Mail, ShieldCheck, Users, ArrowRight, X, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'staff'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    const { data: user, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', cleanEmail)
      .eq('password', password)
      .eq('role', role)
      .single()

    if (error || !user) {
      setErrorMessage(`Invalid ${role === 'admin' ? 'Admin' : 'Staff'} credentials! Please check your email and password.`)
      setLoading(false)
      return
    }

    if (user.is_suspended) {
      setErrorMessage('Your account has been suspended. Please contact the administrator.')
      setLoading(false)
      return
    }

    localStorage.setItem(
      'ullash_current_user',
      JSON.stringify({
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name || (role === 'admin' ? 'Admin' : 'Staff Member'),
      })
    )

    router.push('/')
  }

  // Real Backend API call kore email pathanor handler
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotMessage('')
    setForgotError('')

    const cleanEmail = forgotEmail.trim().toLowerCase()

    try {
      const res = await fetch('/api/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        setForgotError(data.error || 'Failed to send reset email.')
      } else {
        setForgotMessage(`A secure password reset link has been sent to ${cleanEmail}. Please check your email inbox or spam folder.`)
      }
    } catch (err: any) {
      setForgotError('Network error: ' + err.message)
    }

    setForgotLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Flower2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Ullash Portal</h2>
            <p className="text-xs text-slate-400 font-medium">Event & Budget Workspace</p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl mb-6 border border-slate-100">
          <button
            type="button"
            onClick={() => { setRole('admin'); setErrorMessage(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${role === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <ShieldCheck size={15} /> Admin Portal
          </button>
          <button
            type="button"
            onClick={() => { setRole('staff'); setErrorMessage(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${role === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Users size={15} /> Staff Portal
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-600">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 capitalize">
              {role} Email
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-slate-500 transition">
              <Mail size={16} className="text-slate-400 shrink-0" />
              <input
                required
                type="email"
                placeholder={role === 'admin' ? 'admin@ullash.com' : 'staff@ullash.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotMessage('');
                  setForgotError('');
                  setShowForgotModal(true);
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-slate-500 transition">
              <KeyRound size={16} className="text-slate-400 shrink-0" />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : `Sign In as ${role === 'admin' ? 'Admin' : 'Staff'}`}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {/* Forgot Password Modal (Safe Email Delivery Only) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter your email to receive a password reset link.</p>
              </div>
              <button onClick={() => setShowForgotModal(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 font-medium">
                {forgotError}
              </div>
            )}

            {forgotMessage ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">Email Sent!</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{forgotMessage}</p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="mt-3 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Registered Email</label>
                  <input
                    required
                    type="email"
                    placeholder="your-email@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-500 font-medium"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}