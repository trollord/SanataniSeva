/** Single source of truth for the transactional from-address. */
export const EMAIL_FROM = "Sanatani Community <noreply@bluebrics.com>";

// Branded HTML email templates. Email clients need inline styles and
// table-based layout; fonts fall back to Georgia (serif headings, matching
// the site's Playfair look) and system sans for body text.

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ));
}

const serif = `Georgia, 'Times New Roman', serif`;
const sans = `-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

/** Shared shell: dark wordmark header, white card, legal footer. */
function shell(content: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f5f5f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

            <!-- Header -->
            <tr>
              <td style="background-color:#FF5F15;border-radius:14px 14px 0 0;padding:22px 32px;">
                <span style="font-family:${sans};font-size:17px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                  Blue<span style="color:rgba(255,255,255,0.6);">Bricks</span>
                </span>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="background-color:#ffffff;border-radius:0 0 14px 14px;padding:36px 32px;">
                ${content}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 24px 0;">
                <p style="font-family:${sans};font-size:11px;color:#9a9a9a;margin:0;">
                  &copy; ${new Date().getFullYear()} Sanatani Community &middot; Powered by ByteLights
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailVerificationEmail(opts: {
  name: string | null;
  otp: string;
}): { subject: string; html: string } {
  const name = escapeHtml(opts.name ?? "there");
  const otp = escapeHtml(opts.otp);

  const subject = `${opts.otp} is your Sanatani Community verification code`;

  const content = `
    <p style="font-family:${sans};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#9a9a9a;margin:0 0 14px;">
      Email Verification
    </p>
    <h1 style="font-family:${serif};font-size:26px;line-height:1.25;font-weight:700;color:#FF5F15;margin:0 0 18px;">
      Confirm your email address
    </h1>
    <p style="font-family:${sans};font-size:14px;line-height:1.7;color:#555555;margin:0 0 24px;">
      Hi ${name}, welcome to Sanatani Community! Use the code below to verify
      your email and activate your account. Tap and hold the code to copy it on
      your phone.
    </p>

    <!-- OTP - plain selectable text so it can be copied on iOS & Android -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border:1px solid #eeeeee;border-radius:10px;">
      <tr>
        <td align="center" style="padding:22px;">
          <p style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#FF5F15;margin:0;user-select:all;-webkit-user-select:all;">${otp}</p>
        </td>
      </tr>
    </table>

    <p style="font-family:${sans};font-size:13px;line-height:1.7;color:#555555;margin:22px 0 0;">
      This code expires in <b>10 minutes</b> and can be used only once.
    </p>
    <p style="font-family:${sans};font-size:12px;line-height:1.6;color:#9a9a9a;margin:14px 0 0;">
      If you didn't create an account with us, you can safely ignore this email.
    </p>`;

  return { subject, html: shell(content) };
}

export function passwordResetEmail(opts: {
  name: string | null;
  otp: string;
}): { subject: string; html: string } {
  const name = escapeHtml(opts.name ?? "there");
  const otp = escapeHtml(opts.otp);

  // Code in the subject too - helps iOS/Android surface it as a copyable code
  const subject = `${opts.otp} is your Sanatani Community password reset code`;

  const content = `
    <p style="font-family:${sans};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#9a9a9a;margin:0 0 14px;">
      Password Reset
    </p>
    <h1 style="font-family:${serif};font-size:26px;line-height:1.25;font-weight:700;color:#FF5F15;margin:0 0 18px;">
      Your verification code
    </h1>
    <p style="font-family:${sans};font-size:14px;line-height:1.7;color:#555555;margin:0 0 24px;">
      Hi ${name}, use the code below to reset your Sanatani Community password.
      Tap and hold the code to copy it on your phone.
    </p>

    <!-- OTP - plain selectable text so it can be copied on iOS & Android -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border:1px solid #eeeeee;border-radius:10px;">
      <tr>
        <td align="center" style="padding:22px;">
          <p style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#FF5F15;margin:0;user-select:all;-webkit-user-select:all;">${otp}</p>
        </td>
      </tr>
    </table>

    <p style="font-family:${sans};font-size:13px;line-height:1.7;color:#555555;margin:22px 0 0;">
      This code expires in <b>10 minutes</b> and can be used only once.
    </p>
    <p style="font-family:${sans};font-size:12px;line-height:1.6;color:#9a9a9a;margin:14px 0 0;">
      If you didn't request a password reset, you can safely ignore this email -
      your password will remain unchanged.
    </p>`;

  return { subject, html: shell(content) };
}

export function newInquiryEmail(opts: {
  ownerName: string | null;
  seekerName: string | null;
  seekerPhone: string;
  propertyTitle: string;
  baseUrl: string;
  message?: string;
  callbackTime?: string;
}): { subject: string; html: string } {
  const owner = escapeHtml(opts.ownerName ?? "there");
  const seeker = escapeHtml(opts.seekerName ?? "A property seeker");
  const title = escapeHtml(opts.propertyTitle);
  const phone = escapeHtml(opts.seekerPhone);
  const dashboardUrl = `${opts.baseUrl}/dashboard/inquiries`;

  const subject = `New lead - ${opts.seekerName ?? "a seeker"} is interested in "${opts.propertyTitle}"`;

  const content = `
    <p style="font-family:${sans};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#9a9a9a;margin:0 0 14px;">
      New Lead Received
    </p>
    <h1 style="font-family:${serif};font-size:26px;line-height:1.25;font-weight:700;color:#FF5F15;margin:0 0 18px;">
      Someone is interested in your&nbsp;property
    </h1>
    <p style="font-family:${sans};font-size:14px;line-height:1.7;color:#555555;margin:0 0 24px;">
      Hi ${owner}, you have a new inquiry on
      <b style="color:#FF5F15;">&ldquo;${title}&rdquo;</b>.
    </p>

    <!-- Lead card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border:1px solid #eeeeee;border-radius:10px;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="font-family:${sans};font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#9a9a9a;margin:0 0 6px;">
            Interested Seeker
          </p>
          <p style="font-family:${sans};font-size:15px;font-weight:600;color:#FF5F15;margin:0 0 3px;">
            ${seeker}
          </p>
          <p style="font-family:${sans};font-size:13px;color:#555555;margin:0;">
            ${phone}
          </p>
          ${opts.callbackTime ? `<p style="font-family:${sans};font-size:12px;color:#9a9a9a;margin:6px 0 0;">Best time to call: <b style="color:#555">${escapeHtml(opts.callbackTime)}</b></p>` : ""}
          ${opts.message ? `<p style="font-family:${sans};font-size:13px;color:#555555;margin:10px 0 0;padding-top:10px;border-top:1px solid #eee;">&ldquo;${escapeHtml(opts.message)}&rdquo;</p>` : ""}
        </td>
      </tr>
    </table>

    <p style="font-family:${sans};font-size:14px;line-height:1.7;color:#555555;margin:24px 0 28px;">
      View the full lead and manage all your inquiries from your dashboard.
    </p>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#FF5F15;border-radius:999px;">
          <a href="${dashboardUrl}"
             style="display:inline-block;font-family:${sans};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;padding:13px 34px;border-radius:999px;">
            View Lead in Dashboard
          </a>
        </td>
      </tr>
    </table>

    <p style="font-family:${sans};font-size:12px;line-height:1.6;color:#9a9a9a;margin:26px 0 0;">
      Tip: leads move fast - reaching out within a few hours greatly improves your chances of closing.
    </p>`;

  return { subject, html: shell(content) };
}

export function itemInterestEmail(opts: {
  sellerName: string | null;
  buyerName: string | null;
  buyerEmail: string;
  itemTitle: string;
  message: string;
  callbackTime: string;
  baseUrl: string;
}): { subject: string; html: string } {
  const seller = escapeHtml(opts.sellerName ?? "there");
  const buyer = escapeHtml(opts.buyerName ?? "Someone");
  const title = escapeHtml(opts.itemTitle);
  const msg = escapeHtml(opts.message);
  const time = escapeHtml(opts.callbackTime);
  const email = escapeHtml(opts.buyerEmail);

  const subject = `${opts.buyerName ?? "Someone"} is interested in your item "${opts.itemTitle}"`;

  const content = `
    <p style="font-family:${sans};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#9a9a9a;margin:0 0 14px;">
      New Interest · Marketplace
    </p>
    <h1 style="font-family:${serif};font-size:26px;line-height:1.25;font-weight:700;color:#FF5F15;margin:0 0 18px;">
      Someone wants your&nbsp;item
    </h1>
    <p style="font-family:${sans};font-size:14px;line-height:1.7;color:#555555;margin:0 0 24px;">
      Hi ${seller}, <b>${buyer}</b> is interested in your listing <b style="color:#FF5F15;">&ldquo;${title}&rdquo;</b>.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border:1px solid #eeeeee;border-radius:10px;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="font-family:${sans};font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#9a9a9a;margin:0 0 6px;">Their message</p>
          <p style="font-family:${sans};font-size:14px;color:#333;font-style:italic;margin:0 0 12px;">&ldquo;${msg}&rdquo;</p>
          <p style="font-family:${sans};font-size:12px;color:#9a9a9a;margin:0;">Best time to call: <b style="color:#555">${time}</b></p>
          <p style="font-family:${sans};font-size:12px;color:#9a9a9a;margin:6px 0 0;">Reply to: <b style="color:#555">${email}</b></p>
        </td>
      </tr>
    </table>

    <p style="font-family:${sans};font-size:12px;line-height:1.6;color:#9a9a9a;margin:26px 0 0;">
      Reach out to them directly to arrange viewing and payment.
    </p>`;

  return { subject, html: shell(content) };
}
