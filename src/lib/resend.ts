import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = 'L-flat PiANOS <noreply@rental.l-flat-reserve.com>'
export const COMPANY_NAME = '株式会社エルフラット'
