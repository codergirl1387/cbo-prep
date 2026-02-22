import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Vercel calls this at 2:40 PM EST (19:40 UTC) every day
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.APP_CRON_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recipient = process.env.RECIPIENT_EMAIL;
  if (!recipient) {
    return NextResponse.json({ error: 'No RECIPIENT_EMAIL set' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipient,
    subject: `⏰ Time to study, Netra! Today's flashcards are waiting`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#2563eb">Hey Netra! 🧬</h2>
        <p style="font-size:16px;color:#333">
          It's study time! Your daily biology flashcards and quiz are ready for you.
        </p>
        <p style="color:#555">
          Taking just 10 minutes now to review today's cards will make a big difference
          before the CBO on April 9th.
        </p>
        <a href="${baseUrl}/flashcards"
           style="display:inline-block;margin-top:16px;padding:14px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px">
          📚 Open Flashcards →
        </a>
        <a href="${baseUrl}/quiz"
           style="display:inline-block;margin-top:8px;margin-left:8px;padding:14px 28px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px">
          🧪 Take Today's Quiz →
        </a>
        <p style="margin-top:24px;color:#999;font-size:12px">
          Sent automatically by CBO Prep at 2:40 PM every day.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
