import { NextResponse } from 'next/server'
import * as SibApiV3Sdk from '@getbrevo/brevo'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const cleanEmail = email ? email.trim().toLowerCase() : ''

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const brevoApiKey = process.env.BREVO_API_KEY

    if (!supabaseUrl || !supabaseKey || !brevoApiKey) {
      return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // ১. চেক করা ইউজার staff টেবিলে আছে কিনা
    const { data: user, error: userError } = await supabase
      .from('staff')
      .select('id, email, name')
      .eq('email', cleanEmail)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No account found with this email in the database.' },
        { status: 404 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const resetLink = `${siteUrl}/reset-password?email=${encodeURIComponent(cleanEmail)}&token=${user.id}`

    // ২. Brevo API কনফিগারেশন
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey)

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    sendSmtpEmail.subject = 'Password Reset Request - Ullash Portal'
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 520px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Reset Your Password</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${user.name || 'User'}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">You requested to reset your password for Ullash Portal. Click the button below to set a new password:</p>
        <div style="margin: 28px 0;">
          <a href="${resetLink}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">If you did not make this request, you can safely ignore this email.</p>
      </div>
    `
    // প্রেরকের জায়গায় আপনার Brevo অ্যাকাউন্টের ভেরিফায়েড জিমেইলটি দিন
    sendSmtpEmail.sender = { name: 'Ullash Management', email: 'pradipdhara424@gmail.com' }
    sendSmtpEmail.to = [{ email: cleanEmail }]

    await apiInstance.sendTransacEmail(sendSmtpEmail)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Mail Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 })
  }
}