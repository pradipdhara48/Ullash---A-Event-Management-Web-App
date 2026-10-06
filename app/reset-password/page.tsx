'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Flower2, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match!')
      return
    }

    if (newPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.')
      return
    }

    setLoading(true)

    // ডেটাবেসের 'staff' টেবিলে নতুন পাসওয়ার্ড সেভ করা
    const { error } = await supabase
      .from('staff')
      .update({ password: newPassword })
      .eq('email', email.trim().toLowerCase())

    if (error) {
      setErrorMessage('Failed to update password: ' + error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        router.push('/login')
      }, 2500)
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Flower2 size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">Set New Password</h2>
          <p className="text-xs text-slate-400 font-medium">Ullash Account Security</p>
        </div>
      </div>

      {success ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-2">
          <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
          <h3 className="font-bold text-slate-900">Password Updated Successfully!</h3>
          <p className="text-xs text-slate-500">Redirecting to login portal...</p>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-600">
              {errorMessage}
            </div>
          )}

          {/* ইমেইল ফিক্সড (পরিবর্তন করা যাবে না) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Email Address (Locked)</label>
            <input
              disabled
              type="email"
              value={email}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-700 cursor-not-allowed outline-none font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">New Password</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-slate-500 transition">
              <KeyRound size={16} className="text-slate-400 shrink-0" />
              <input
                required
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Confirm New Password</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-slate-500 transition">
              <KeyRound size={16} className="text-slate-400 shrink-0" />
              <input
                required
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Saving...' : 'Confirm & Save Password'}
            <ArrowRight size={16} />
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm font-semibold text-slate-600">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}