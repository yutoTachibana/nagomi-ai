import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

const FROM = process.env.EMAIL_FROM ?? 'こもれび <noreply@example.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'こもれび - メールアドレスの確認',
    text: `こもれびへようこそ。\n\n以下のリンクをクリックして、メールアドレスを確認してください:\n${url}\n\nこのリンクは24時間有効です。\n\n心当たりがない場合は、このメールを無視してください。`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #2a2826;">こもれびへようこそ</h2>
        <p>以下のボタンをクリックして、メールアドレスを確認してください。</p>
        <a href="${url}" style="display: inline-block; background: #c47a5a; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; margin: 16px 0;">メールアドレスを確認する</a>
        <p style="color: #6b6864; font-size: 14px;">このリンクは24時間有効です。<br/>心当たりがない場合は、このメールを無視してください。</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'こもれび - パスワードのリセット',
    text: `パスワードのリセットが要求されました。\n\n以下のリンクからパスワードを再設定してください:\n${url}\n\nこのリンクは1時間有効です。\n\nリクエストした覚えがない場合は、このメールを無視してください。パスワードは変更されません。`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #2a2826;">パスワードのリセット</h2>
        <p>パスワードのリセットが要求されました。以下のボタンから再設定してください。</p>
        <a href="${url}" style="display: inline-block; background: #c47a5a; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; margin: 16px 0;">パスワードを再設定する</a>
        <p style="color: #6b6864; font-size: 14px;">このリンクは1時間有効です。<br/>リクエストした覚えがない場合は、このメールを無視してください。</p>
      </div>
    `,
  });
}
