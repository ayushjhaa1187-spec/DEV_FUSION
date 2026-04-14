/**
 * lib/email.ts
 *
 * Resend-powered transactional email helpers.
 * All emails are plain HTML (no external template engine) for hackathon speed.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL || "SkillBridge <noreply@skillbridge.edu>";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubscriptionConfirmationArgs {
  email: string;
  name: string;
  plan: string;
  amount: number;
  nextBillingDate: string;
  invoiceId: string;
}

interface PaymentFailedArgs {
  email: string;
  name: string;
  amount: number;
  reason: string;
}

interface CreditPurchaseArgs {
  email: string;
  name: string;
  creditsAdded: number;
  amount: number;
  paymentId: string;
}

interface MentorPayoutArgs {
  mentorEmail: string;
  mentorName: string;
  grossAmount: number;
  platformFee: number;
  mentorPayout: number;
  commissionRate: number;
  mentorTier: string;
  bookingId: string;
}

interface OrganizationApplicationArgs {
  to: string;
  organizationName: string;
  applicantName: string;
  applicantReputation: number;
  dashboardUrl: string;
}

interface BookingConfirmationArgs {
  to: string;
  isMentor: boolean;
  otherPartyName: string;
  startTime: string;
  meetingUrl: string;
}

interface MentorStatusArgs {
  to: string;
  name: string;
  status: 'approved' | 'rejected' | 'pending';
  reason?: string;
}

interface CertificateEmailArgs {
  to: string;
  name: string;
  subject: string;
  certificateUrl: string;
}

// ─── Shared HTML shell ────────────────────────────────────────────────────────
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0a0612; color: #e2e8f0; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; padding: 0 20px; }
    .card { background: #13111e; border: 1px solid #2d2b3d; border-radius: 16px;
            overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed);
              padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #fff; }
    .header p { margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.7); }
    .body { padding: 28px 32px; }
    .body p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #cbd5e1; }
    .row { display: flex; justify-content: space-between; align-items: center;
           padding: 10px 0; border-bottom: 1px solid #2d2b3d; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #94a3b8; }
    .value { font-weight: 600; color: #f1f5f9; }
    .cta { display: inline-block; margin: 20px 0 0; background: #4f46e5;
           color: #fff !important; padding: 12px 24px; border-radius: 8px;
           text-decoration: none; font-weight: 600; font-size: 14px; }
    .footer { padding: 20px 32px; border-top: 1px solid #2d2b3d;
              font-size: 12px; color: #475569; text-align: center; }
    .badge { display: inline-block; background: rgba(79,70,229,0.15); color: #818cf8;
             border: 1px solid rgba(79,70,229,0.3); border-radius: 999px;
             padding: 3px 12px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
    </div>
    <div style="text-align:center;margin-top:20px;font-size:12px;color:#475569;">
      © 2026 SkillBridge · <a href="https://skillbridge.edu/unsubscribe" style="color:#6366f1;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email Functions ──────────────────────────────────────────────────────────
export async function sendSubscriptionConfirmationEmail(args: SubscriptionConfirmationArgs) {
  const nextDate = new Date(args.nextBillingDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  const html = emailShell(`
    <div class="header">
      <h1>🎉 Welcome to SkillBridge ${args.plan}!</h1>
      <p>Your subscription is now active</p>
    </div>
    <div class="body">
      <p>Hi ${args.name},</p>
      <p>Your payment was successful. You now have full ${args.plan} access to SkillBridge.</p>
      <div class="row"><span class="label">Plan</span><span class="value badge">${args.plan}</span></div>
      <div class="row"><span class="label">Amount Paid</span><span class="value">₹${args.amount.toFixed(2)}</span></div>
      <div class="row"><span class="label">Next Billing</span><span class="value">${nextDate}</span></div>
      <div class="row"><span class="label">Invoice ID</span><span class="value" style="font-size:12px;font-family:monospace">${args.invoiceId}</span></div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing/history" class="cta">View Invoice →</a>
    </div>
    <div class="footer">SkillBridge · Because every doubt deserves an answer.</div>
  `);

  return resend.emails.send({
    from: FROM,
    to: args.email,
    subject: `✅ SkillBridge ${args.plan} — Payment Confirmed`,
    html,
  });
}

export async function sendPaymentFailedEmail(args: PaymentFailedArgs) {
  const html = emailShell(`
    <div class="header" style="background:linear-gradient(135deg,#7f1d1d,#991b1b);">
      <h1>⚠️ Payment Failed</h1>
      <p>Action required to restore access</p>
    </div>
    <div class="body">
      <p>Hi ${args.name},</p>
      <p>Unfortunately your payment of <strong>₹${args.amount.toFixed(2)}</strong> could not be processed.</p>
      <div class="row"><span class="label">Reason</span><span class="value" style="color:#fca5a5">${args.reason}</span></div>
      <p style="margin-top:20px">Please update your payment method to continue enjoying SkillBridge without interruption.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing/plans" class="cta" style="background:#dc2626">Retry Payment →</a>
    </div>
    <div class="footer">SkillBridge · Need help? Contact support@skillbridge.edu</div>
  `);

  return resend.emails.send({
    from: FROM,
    to: args.email,
    subject: "⚠️ SkillBridge — Payment Failed",
    html,
  });
}

export async function sendCreditPurchaseEmail(args: CreditPurchaseArgs) {
  const html = emailShell(`
    <div class="header" style="background:linear-gradient(135deg,#0f4c81,#1e40af);">
      <h1>🪙 Credits Added!</h1>
      <p>Your AI wallet has been topped up</p>
    </div>
    <div class="body">
      <p>Hi ${args.name},</p>
      <p>Your AI credits have been added to your wallet. Start solving doubts!</p>
      <div class="row"><span class="label">Credits Added</span><span class="value" style="color:#60a5fa">+${args.creditsAdded} credits</span></div>
      <div class="row"><span class="label">Amount Paid</span><span class="value">₹${args.amount.toFixed(2)}</span></div>
      <div class="row"><span class="label">Payment ID</span><span class="value" style="font-size:12px;font-family:monospace">${args.paymentId}</span></div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/doubts" class="cta">Start Solving →</a>
    </div>
    <div class="footer">Credits never expire. Use them anytime.</div>
  `);

  return resend.emails.send({
    from: FROM,
    to: args.email,
    subject: `🪙 +${args.creditsAdded} AI Credits Added to Your SkillBridge Wallet`,
    html,
  });
}

export async function sendMentorPayoutEmail(args: MentorPayoutArgs) {
  const html = emailShell(`
    <div class="header" style="background:linear-gradient(135deg,#064e3b,#065f46);">
      <h1>💸 Session Completed — Payout Recorded</h1>
      <p>Your earnings have been logged for the next payout cycle</p>
    </div>
    <div class="body">
      <p>Hi ${args.mentorName},</p>
      <p>A session has been marked as completed and your earnings have been recorded.</p>
      <div class="row"><span class="label">Tier</span><span class="value badge">${args.mentorTier}</span></div>
      <div class="row"><span class="label">Session Fee</span><span class="value">₹${args.grossAmount.toFixed(2)}</span></div>
      <div class="row"><span class="label">Platform Fee (${args.commissionRate.toFixed(0)}%)</span><span class="value" style="color:#fca5a5">−₹${args.platformFee.toFixed(2)}</span></div>
      <div class="row"><span class="label">Your Earnings</span><span class="value" style="color:#34d399;font-size:18px">₹${args.mentorPayout.toFixed(2)}</span></div>
      <p style="font-size:13px;color:#64748b;margin-top:12px">Payouts are processed on the 1st and 15th of each month. Reduce your commission rate by completing more sessions and maintaining a high rating.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/mentors/dashboard" class="cta">View Earnings Dashboard →</a>
    </div>
    <div class="footer">SkillBridge Mentor Programme · Thank you for teaching!</div>
  `);

  return resend.emails.send({
    from: FROM,
    to: args.mentorEmail,
    subject: `💸 SkillBridge — ₹${args.mentorPayout.toFixed(2)} Earnings Recorded`,
    html,
  });
}

export async function sendGenericEmail(to: string, subject: string, html: string) {
  return resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendOrganizationApplicationEmail(args: OrganizationApplicationArgs) {
  const html = emailShell(`
    <div class="header" style="background:linear-gradient(135deg,#047857,#0f766e);">
      <h1>🏢 New Organization Application</h1>
      <p>Someone wants to join your organization</p>
    </div>
    <div class="body">
      <p>Hi there,</p>
      <p><strong>${args.applicantName}</strong> has just applied to join <strong>${args.organizationName}</strong>.</p>
      <div class="row"><span class="label">Applicant Reputation</span><span class="value badge">${args.applicantReputation} pts</span></div>
      <p style="margin-top:20px">Please review their application in your dashboard.</p>
      <a href="${args.dashboardUrl}" class="cta">Go to Dashboard →</a>
    </div>
    <div class="footer">SkillBridge Organization Portal</div>
  `);

  return resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `🏢 New Application for ${args.organizationName}`,
    html,
  });
}

export async function sendBookingConfirmationEmail(args: BookingConfirmationArgs) {
  const role = args.isMentor ? "Mentor" : "Student";
  const html = emailShell(`
    <div class="header" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);">
      <h1>📅 Session Confirmed!</h1>
      <p>Your SkillBridge mentorship session is booked</p>
    </div>
    <div class="body">
      <p>Hi there,</p>
      <p>The session between you and <strong>${args.otherPartyName}</strong> has been confirmed.</p>
      <div class="row"><span class="label">Time</span><span class="value">${args.startTime}</span></div>
      <div class="row"><span class="label">Your Role</span><span class="value banner">${role}</span></div>
      <p style="margin-top:20px">You can join the session using the button below at the scheduled time.</p>
      <a href="${args.meetingUrl}" class="cta">Join Session →</a>
    </div>
    <div class="footer">SkillBridge · Because every doubt deserves an answer.</div>
  `);

  return resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `📅 SkillBridge Session Confirmed: ${args.startTime}`,
    html,
  });
}

export async function sendMentorStatusEmail(args: MentorStatusArgs) {
  const isApproved = args.status === 'approved';
  const html = emailShell(`
    <div class="header" style="background:${isApproved ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#dc2626,#ef4444)'};">
      <h1>${isApproved ? '🎊 Application Approved!' : 'Application Update'}</h1>
      <p>Your mentor application status has been updated</p>
    </div>
    <div class="body">
      <p>Hi ${args.name},</p>
      <p>Your application to become a verified mentor on SkillBridge has been <strong>${args.status}</strong>.</p>
      ${args.reason ? `<p style="color:#fca5a5"><strong>Reason:</strong> ${args.reason}</p>` : ''}
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/mentors/dashboard" class="cta">Go to Mentor Dashboard →</a>
    </div>
    <div class="footer">SkillBridge Mentor Program</div>
  `);

  return resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `✅ SkillBridge Mentor Application: ${args.status.toUpperCase()}`,
    html,
  });
}

export async function sendCertificateEmail(args: CertificateEmailArgs) {
  const html = emailShell(`
    <div class="header" style="background:linear-gradient(135deg,#8b5cf6,#a78bfa);">
      <h1>🏆 You've Earned a Certificate!</h1>
      <p>Congratulations on completing the assessment</p>
    </div>
    <div class="body">
      <p>Hi ${args.name},</p>
      <p>Well done! You have successfully completed the <strong>${args.subject}</strong> assessment and earned your official SkillBridge certificate.</p>
      <p style="margin-top:20px">You can view, download, and share your verified certificate below.</p>
      <a href="${args.certificateUrl}" class="cta">View Certificate →</a>
    </div>
    <div class="footer">SkillBridge · Validating Your Potential</div>
  `);

  return resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `🏆 Certificate Earned: ${args.subject}`,
    html,
  });
}
