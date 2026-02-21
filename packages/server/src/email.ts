import { BrevoClient } from '@getbrevo/brevo'

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY ?? '',
})

const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'noreply@synflow.com'
const senderName = process.env.BREVO_SENDER_NAME ?? 'Synflow'
const appUrl = process.env.APP_URL ?? 'http://localhost:3000'

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${appUrl}/api/verify-email?token=${token}`

  await brevo.transactionalEmails.sendTransacEmail({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, name: firstName }],
    subject: 'Verify your Synflow account',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #4f46e5;">Welcome to Synflow, ${firstName}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${verifyUrl}" style="color: #4f46e5;">${verifyUrl}</a>
        </p>
        <p style="color: #ef4444; font-size: 13px; margin-top: 16px;">
          This link expires in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          If you didn't create an account with Synflow, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendAccountCreatedEmail(
  to: string,
  firstName: string,
): Promise<void> {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, name: firstName }],
    subject: 'Your Synflow account has been created',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #4f46e5;">Welcome aboard, ${firstName}!</h2>
        <p>Your Synflow account has been successfully created. You can now sign in using your email and password.</p>
        <a href="${appUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
          Sign In
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Synflow. All rights reserved.
        </p>
      </div>
    `,
  })
}
