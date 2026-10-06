'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Flower2, ShieldCheck, Users, ArrowRight, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'staff'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Default admin demo credentials
    if (!localStorage.getItem('ullash_admin')) {
      localStorage.setItem(
        'ullash_admin',
        JSON.stringify({ email: 'admin@ullash.com', password: 'admin' })
      )
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (role === 'admin') {
      const storedAdmin = JSON.parse(localStorage.getItem('ullash_admin') || '{"email":"admin@ullash.com","password":"admin"}')
      if (email.trim() === storedAdmin.email && password === storedAdmin.password) {
        localStorage.setItem(
          'ullash_current_user',
          JSON.stringify({ role: 'admin', email: email.trim(), name: 'Admin User' })
        )
        router.push('/')
      } else {
        setErrorMsg('Invalid Admin credentials! (Default: admin@ullash.com / admin)')
      }
    } else {
      const staffList = JSON.parse(localStorage.getItem('ullash_staff_list') || '[]')
      const matchedStaff = staffList.find(
        (s: any) => s.email.toLowerCase() === email.trim().toLowerCase() && s.password === password
      )

      if (matchedStaff) {
        localStorage.setItem(
          'ullash_current_user',
          JSON.stringify({ role: 'staff', email: matchedStaff.email, name: matchedStaff.name })
        )
        router.push('/')
      } else {
        setErrorMsg('Invalid Staff credentials or account not yet created by Admin!')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Flower2 size={20} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-950">Ullash</span>
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            {role === 'admin' ? 'Admin Portal Login' : 'Staff Portal Login'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {role === 'admin'
              ? 'Log in to manage full events, finances, and staff members'
              : 'Log in with credentials provided by your event administrator'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
            <div
              className={`flex size-9 items-center justify-center rounded-lg ${
                role === 'admin' ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {role === 'admin' ? <ShieldCheck size={18} /> : <Users size={18} />}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Current Role: <span className="capitalize">{role}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                {role === 'admin' ? 'Full administrative access' : 'Staff operations access'}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">
                {role === 'admin' ? 'Admin Email' : 'Staff Email'}
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'admin' ? 'admin@ullash.com' : 'staff@example.com'}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Sign In as {role === 'admin' ? 'Admin' : 'Staff'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 text-center text-xs font-medium text-slate-400">
              Switch login portal:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('admin')
                  setErrorMsg('')
                  setEmail('')
                  setPassword('')
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                  role === 'admin'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck size={14} /> Admin Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('staff')
                  setErrorMsg('')
                  setEmail('')
                  setPassword('')
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                  role === 'staff'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users size={14} /> Staff Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}