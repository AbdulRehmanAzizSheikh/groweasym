import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASSWORD must be set in .env to send mail"
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter;
}

export function isMailConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
}

/** Where withdrawal requests get delivered. */
export function adminInbox() {
  return process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "";
}

type WithdrawalMail = {
  requestId: string;
  fullName: string;
  mobileNumber: string;
  amount: number;
  method: string;
  payoutDetails: string;
  balanceAfter: number;
  createdAt: Date;
};

export async function sendWithdrawalRequestMail(details: WithdrawalMail) {
  const from =
    process.env.EMAIL_FROM || `"GSA Farming" <${process.env.EMAIL_USER}>`;

  const rows = details.payoutDetails
    .split("\n")
    .filter(Boolean)
    .map((line) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${line}</td></tr>`)
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #eee;border-radius:10px;overflow:hidden">
    <div style="background:linear-gradient(90deg,#2da5ff,#ffb8e9);padding:18px 22px">
      <h2 style="margin:0;color:#fff;font-size:18px">New Withdrawal Request</h2>
    </div>
    <div style="padding:20px 22px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Request ID</td><td style="padding:4px 0;font-weight:bold">${details.requestId}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td style="padding:4px 0;font-weight:bold">${details.fullName}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Mobile</td><td style="padding:4px 0;font-weight:bold">${details.mobileNumber}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Amount</td><td style="padding:4px 0;font-weight:bold;color:#e8ae00">₹${details.amount.toLocaleString("en-IN")}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Method</td><td style="padding:4px 0;font-weight:bold">${details.method}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Requested at</td><td style="padding:4px 0">${details.createdAt.toUTCString()}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Balance after hold</td><td style="padding:4px 0">₹${details.balanceAfter.toLocaleString("en-IN")}</td></tr>
      </table>
      <h4 style="margin:18px 0 6px;color:#333">Payout details</h4>
      <table style="width:100%;border-collapse:collapse;background:#f8f9f9;border-radius:6px;padding:6px">${rows}</table>
      <p style="margin:18px 0 0;font-size:13px;color:#666">
        The amount is already held from the user's balance. After sending the money,
        mark this request as <strong>Paid</strong> in the admin panel.
      </p>
    </div>
  </div>`;

  return getTransporter().sendMail({
    from,
    to: adminInbox(),
    subject: `Withdrawal request: ₹${details.amount.toLocaleString(
      "en-IN"
    )} — ${details.fullName} (${details.mobileNumber})`,
    text: [
      `New withdrawal request`,
      `Request ID: ${details.requestId}`,
      `Name: ${details.fullName}`,
      `Mobile: ${details.mobileNumber}`,
      `Amount: INR ${details.amount}`,
      `Method: ${details.method}`,
      `Requested at: ${details.createdAt.toUTCString()}`,
      ``,
      `Payout details:`,
      details.payoutDetails,
      ``,
      `The amount is already held from the user's balance.`,
    ].join("\n"),
    html,
  });
}

export async function sendWithdrawalDecisionMail(opts: {
  to: string;
  fullName: string;
  amount: number;
  status: "paid" | "rejected";
  note?: string;
}) {
  const from =
    process.env.EMAIL_FROM || `"GSA Farming" <${process.env.EMAIL_USER}>`;
  const subject =
    opts.status === "paid"
      ? `Your withdrawal of ₹${opts.amount} has been paid`
      : `Your withdrawal of ₹${opts.amount} was rejected`;

  return getTransporter().sendMail({
    from,
    to: opts.to,
    subject,
    text: [
      `Hi ${opts.fullName},`,
      ``,
      opts.status === "paid"
        ? `We have sent INR ${opts.amount} to your registered payout account.`
        : `We could not process your withdrawal of INR ${opts.amount}.`,
      opts.note ? `\nNote: ${opts.note}` : "",
      ``,
      `— Team GSA Farming`,
    ].join("\n"),
  });
}