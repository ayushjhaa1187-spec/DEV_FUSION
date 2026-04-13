import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'SkillBridge <no-reply@skillbridge.dev>';

/**
 * Sends notification to organization owner about new membership applicant
 */
export async function sendOrganizationApplicationEmail({
  to,
  organizationName,
  applicantName,
  applicantReputation,
  dashboardUrl
}: {
  to: string;
  organizationName: string;
  applicantName: string;
  applicantReputation: number;
  dashboardUrl: string;
}) {
  return sendGenericEmail({
    to,
    subject: `New Application: ${applicantName} wants to join ${organizationName}`,
    title: 'New Organization Application',
    message: `<strong>${applicantName}</strong> (Reputation: ${applicantReputation}) has submitted a request to join <strong>${organizationName}</strong>.`,
    buttonText: 'Review Application',
    buttonUrl: dashboardUrl
  });
}

/**
 * Sends notification to mentor applicant about their approval/rejection status
 */
export async function sendMentorStatusEmail({
  to,
  status,
  mentorName,
  dashboardUrl
}: {
  to: string;
  status: 'approved' | 'rejected';
  mentorName: string;
  dashboardUrl: string;
}) {
  const isApproved = status === 'approved';
  return sendGenericEmail({
    to,
    subject: isApproved ? 'Welcome to the SkillBridge Mentor Circle! 🎓' : 'Update on your Mentor Application',
    title: isApproved ? 'Application Approved' : 'Application Update',
    message: isApproved 
      ? `Congratulations <strong>${mentorName}</strong>! Your application has been approved. You can now set your availability and start hosting sessions.`
      : `Hi ${mentorName}, thank you for your interest. At this time, we are unable to approve your application. Feel free to re-apply once you have gained more reputation in the community.`,
    buttonText: isApproved ? 'Go to Dashboard' : 'View Profile',
    buttonUrl: dashboardUrl
  });
}

/**
 * Sends booking confirmation to both student and mentor
 */
export async function sendBookingConfirmationEmail({
  to,
  isMentor,
  otherPartyName,
  startTime,
  meetingUrl
}: {
  to: string;
  isMentor: boolean;
  otherPartyName: string;
  startTime: string;
  meetingUrl: string;
}) {
  return sendGenericEmail({
    to,
    subject: `Meeting Confirmed: ${startTime}`,
    title: 'Session Scheduled',
    message: isMentor 
      ? `A new session has been booked by <strong>${otherPartyName}</strong>.`
      : `Your session with <strong>${otherPartyName}</strong> is confirmed.`,
    secondaryMessage: `Time: ${startTime}`,
    buttonText: 'Join Meeting',
    buttonUrl: meetingUrl
  });
}

/**
 * BASE GENERIC TEMPLATE
 */
async function sendGenericEmail({
  to,
  subject,
  title,
  message,
  secondaryMessage,
  buttonText,
  buttonUrl
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
  secondaryMessage?: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff; color: #1a1a1a;">
          <div style="margin-bottom: 24px;">
             <span style="color: #7c3aed; font-weight: 800; font-size: 24px; letter-spacing: -0.5px;">SkillBridge</span>
          </div>
          <h2 style="color: #111827; font-size: 22px; margin-bottom: 16px;">${title}</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">${message}</p>
          ${secondaryMessage ? `<p style="font-size: 15px; background: #f9fafb; padding: 12px; border-radius: 8px; color: #6b7280; margin-bottom: 24px;">${secondaryMessage}</p>` : ''}
          ${buttonText && buttonUrl ? `
            <div style="margin-top: 32px; margin-bottom: 32px;">
              <a href="${buttonUrl}" style="background-color: #7c3aed; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">${buttonText}</a>
            </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">You received this because an action was taken on your SkillBridge account.<br/>© ${new Date().getFullYear()} SkillBridge Protocol.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Email Error:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error('Email caught error:', err);
    return { success: false, error: err };
  }
}
