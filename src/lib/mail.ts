import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_SERVER_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER, 
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

import prisma from '@/lib/prisma';

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  let companyName = 'DIA MAKMUR ABADI';
  try {
    const setting = await prisma.setting.findFirst();
    if (setting?.companyName) {
      companyName = setting.companyName;
    }
  } catch (e) {
    console.error('Failed to fetch setting for email', e);
  }

  // Log to terminal for debugging and dev environments without email set up
  console.log('====================================================');
  console.log(`Password reset link generated for ${email}`);
  console.log(`RESET LINK: ${resetLink}`);
  console.log('====================================================');

  if (!process.env.EMAIL_SERVER_USER) {
    console.warn('EMAIL_SERVER_USER is not configured. Email will not be sent, check the console for the reset link.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${companyName}" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: `Reset Kata Sandi Anda - ${companyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; text-align: center;">Reset Kata Sandi</h2>
          <p style="color: #475569; line-height: 1.6;">
            Anda menerima email ini karena ada permintaan untuk mengatur ulang kata sandi akun Anda di ${companyName}.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2170e4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Kata Sandi
            </a>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            Jika Anda tidak merasa meminta reset kata sandi, abaikan saja email ini. Tautan ini akan kedaluwarsa dalam waktu 1 jam.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            ${companyName} &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `,
    });
    console.log('Password reset email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Gagal mengirim email reset kata sandi.');
  }
};
