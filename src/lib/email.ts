export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured in .env');
    return { success: false, error: 'RESEND_API_KEY missing' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'CLATly <noreply@clatly.com>',
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Failed to send email via Resend:', errText);
      return { success: false, error: errText };
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err) {
    console.error('Resend email sending unexpected error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
