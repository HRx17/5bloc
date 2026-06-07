import React from 'react'

// Common styling constants
const styles = {
 container: 'background-color: #0C1220; color: #F7F5F0; font-family: "DM Sans", Helvetica, sans-serif; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; box-sizing: border-box;',
 header: 'display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #1C2A3E; padding-bottom: 20px; margin-bottom: 24px;',
 title: 'font-family: "Bebas Neue", sans-serif; font-size: 28px; color: #F7F5F0; letter-spacing: 0.06em; line-height: 1; margin: 0;',
 tagline: 'color: #F5A623; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; margin-top: 2px;',
 headline: 'font-size: 20px; font-weight: bold; color: #F5A623; margin-top: 0; margin-bottom: 12px;',
 text: 'font-size: 14px; line-height: 1.6; color: #EDE9E2; margin-top: 0; margin-bottom: 16px;',
 button: 'display: inline-block; background-color: #F5A623; color: #0C1220; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 6px; text-align: center; margin: 16px 0; border: none; cursor: pointer;',
 footer: 'border-top: 1px solid #1C2A3E; padding-top: 20px; margin-top: 30px; font-size: 11px; color: #9E9687; font-family: "JetBrains Mono", monospace;',
 table: 'width: 100%; : collapse; margin: 16px 0; font-size: 13px;',
 th: 'text-align: left; padding: 8px; border-bottom: 1px solid #1C2A3E; color: #9E9687; font-weight: 500;',
 td: 'padding: 8px; border-bottom: 1px solid #1C2A3E; color: #EDE9E2;',
}

const logoMarkSvg = `
 <svg width="32" height="32" viewBox="0 0 40 40" fill="none" style="display: inline-block; vertical-align: middle;">
 <rect x="6" y="6" width="28" height="6" rx="1.5" fill="#F5A623"/>
 <rect x="6" y="15" width="22" height="6" rx="1.5" fill="#F5A623" opacity="0.75"/>
 <rect x="6" y="24" width="16" height="6" rx="1.5" fill="#F5A623" opacity="0.5"/>
 <rect x="6" y="33" width="10" height="5" rx="1.5" fill="#F5A623" opacity="0.28"/>
 </svg>
`

function buildEmailHtml(contentHtml: string) {
 return `
 <!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <title>5Bloc Notification</title>
 <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
 </head>
 <body style="background-color: #05080f; padding: 20px; margin: 0;">
 <div style="${styles.container}">
 <div style="${styles.header}">
 ${logoMarkSvg}
 <div style="display: inline-block; vertical-align: middle; margin-left: 10px;">
 <h1 style="${styles.title}">5BLOC</h1>
 <div style="${styles.tagline}">Build Together</div>
 </div>
 </div>
 ${contentHtml}
 <div style="${styles.footer}">
 <p style="margin: 0 0 4px 0;">5Bloc — Where Projects Get Built</p>
 <p style="margin: 0;">This is an automated notification. Contact: contact@5bloc.com</p>
 </div>
 </div>
 </body>
 </html>
 `
}

// 1. Welcome Email
export function WelcomeEmail(userName: string) {
 return buildEmailHtml(`
 <h2 style="${styles.headline}">Welcome to 5Bloc, ${userName}!</h2>
 <p style="${styles.text}">You have successfully registered your firm. Get ready to eliminate the chaos of WhatsApp groups, Excel trackers, and scattered blueprints.</p>
 <p style="${styles.text}">Here is how to set up your workspace in under 3 minutes:</p>
 <table style="${styles.table}">
 <tr>
 <th style="${styles.th}">Step</th>
 <th style="${styles.th}">Action</th>
 </tr>
 <tr>
 <td style="${styles.td}">1</td>
 <td style="${styles.td}">Add your first active Client to the pipeline.</td>
 </tr>
 <tr>
 <td style="${styles.td}">2</td>
 <td style="${styles.td}">Create a Project workspace and establish phase milestones.</td>
 </tr>
 <tr>
 <td style="${styles.td}">3</td>
 <td style="${styles.td}">Upload layouts and invite contractors to check off deliverables.</td>
 </tr>
 </table>
 <div style="text-align: center;">
 <a href="https://app.5bloc.com/dashboard" style="${styles.button}">GO TO MY DASHBOARD</a>
 </div>
 `)
}

// 2. Invite Email
export function InviteEmail(inviterName: string, projectName: string, role: string, acceptUrl: string) {
 return buildEmailHtml(`
 <h2 style="${styles.headline}">Collaboration Invite</h2>
 <p style="${styles.text}">${inviterName} has invited you to join the project workspace <strong style="color: #F7F5F0;">${projectName}</strong> on 5Bloc.</p>
 <p style="${styles.text}">You are invited to collaborate as a: <strong style="color: #F5A623; text-transform: uppercase;">${role}</strong>.</p>
 <p style="${styles.text}">Accepting this invitation will grant you access to upload drawings, review RFIs, and coordinate milestone logs.</p>
 <div style="text-align: center;">
 <a href="${acceptUrl}" style="${styles.button}">ACCEPT INVITATION →</a>
 </div>
 `)
}

// 3. RFI Created Email
export function RFICreatedEmail(rfiNumber: number, title: string, description: string, dueDate: string, viewUrl: string) {
 return buildEmailHtml(`
 <h2 style="${styles.headline}">New RFI Assigned: #${rfiNumber}</h2>
 <p style="${styles.text}">A new Request for Information query has been raised and assigned to your attention.</p>
 <div style="background-color: #141E30; border: 1px solid #1C2A3E; padding: 16px; border-radius: 8px; margin: 16px 0;">
 <h4 style="margin: 0 0 8px 0; color: #F7F5F0; font-size: 14px;">RFI #${rfiNumber}: ${title}</h4>
 <p style="margin: 0; color: #9E9687; font-size: 12px; line-height: 1.5;">${description}</p>
 </div>
 <p style="${styles.text}"><strong>Due Date:</strong> ${dueDate}</p>
 <div style="text-align: center;">
 <a href="${viewUrl}" style="${styles.button}">VIEW AND RESPOND →</a>
 </div>
 `)
}

// 4. RFI Answered Email
export function RFIAnsweredEmail(rfiNumber: number, query: string, response: string, viewUrl: string) {
 return buildEmailHtml(`
 <h2 style="${styles.headline}">RFI #${rfiNumber} Answered</h2>
 <p style="${styles.text}">Your request for information query has been resolved by the architect.</p>
 <div style="background-color: #141E30; border: 1px solid #1C2A3E; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; line-height: 1.5;">
 <p style="margin: 0 0 8px 0; color: #9E9687;"><strong>Query:</strong> ${query}</p>
 <p style="margin: 0; color: #F5A623;"><strong>Architect Response:</strong> ${response}</p>
 </div>
 <div style="text-align: center;">
 <a href="${viewUrl}" style="${styles.button}">VIEW ON 5BLOC →</a>
 </div>
 `)
}

// 5. Invoice Email
export function InvoiceEmail(invoiceNumber: string, clientName: string, totalAmount: number, dueDate: string, paymentUrl: string) {
 return buildEmailHtml(`
 <h2 style="${styles.headline}">Tax Invoice: ${invoiceNumber}</h2>
 <p style="${styles.text}">Dear ${clientName}, please find attached the billing details for your active milestone phase.</p>
 <table style="${styles.table}">
 <tr>
 <th style="${styles.th}">Invoice Ref</th>
 <th style="${styles.th}">Total Due (₹)</th>
 <th style="${styles.th}">Due Date</th>
 </tr>
 <tr>
 <td style="${styles.td}">${invoiceNumber}</td>
 <td style="${styles.td}">₹${totalAmount.toLocaleString()}</td>
 <td style="${styles.td}">${dueDate}</td>
 </tr>
 </table>
 <p style="${styles.text}">Payment can be released securely online using credit card, NetBanking, or UPI via Razorpay.</p>
 <div style="text-align: center;">
 <a href="${paymentUrl}" style="${styles.button}">PAY ONLINE SECURELY</a>
 </div>
 `)
}

// 6. Invoice Overdue Email
export function InvoiceOverdueEmail(invoiceNumber: string, outstandingAmount: number, dueDate: string, paymentUrl: string) {
 return buildEmailHtml(`
 <h2 style="${styles.headline}; color: #E84545;">Overdue Payment Alert</h2>
 <p style="${styles.text}">This is a reminder that fee invoice <strong style="color: #F7F5F0;">${invoiceNumber}</strong> is currently past its payment due date.</p>
 <div style="background-color: #E84545/10; border: 1px solid #E84545/30; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
 <span style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #E84545;">PAYMENT OVERDUE SINCE ${dueDate}</span>
 <h3 style="margin: 8px 0 0 0; color: #F7F5F0; font-size: 20px;">₹${outstandingAmount.toLocaleString()}</h3>
 </div>
 <div style="text-align: center;">
 <a href="${paymentUrl}" style="${styles.button}; background-color: #E84545; color: #white;">PAY OUTSTANDING BALANCE</a>
 </div>
 `)
}

// 7. Document Approval Email
export function DocumentApprovalEmail(fileName: string, projectName: string, uploaderName: string, approveUrl: string) {
 return buildEmailHtml(`
 <h2 style="${styles.headline}">Document Approval Requested</h2>
 <p style="${styles.text}">${uploaderName} has uploaded a new layout drawing for project <strong style="color: #F7F5F0;">${projectName}</strong> and requested your validation review.</p>
 <div style="background-color: #141E30; border: 1px solid #1C2A3E; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
 <span style="material-icons-outlined" style="font-size: 28px; color: #F5A623;">architecture</span>
 <p style="margin: 8px 0 0 0; color: #F7F5F0; font-family: 'JetBrains Mono', monospace; font-size: 12px;">File: ${fileName}</p>
 </div>
 <div style="text-align: center; display: flex; justify-content: center; gap: 12px;">
 <a href="${approveUrl}" style="${styles.button}">APPROVE DRAWINGS →</a>
 </div>
 `)
}

// 8. Weekly Digest Email
export function WeeklyDigestEmail(projectsCount: number, openRfisCount: number, pendingPaymentsCount: number) {
 return buildEmailHtml(`
 <h2 style="${styles.headline}">5Bloc Weekly Summary Digest</h2>
 <p style="${styles.text}">Here is the weekly progress report for your firm workspace projects.</p>
 <table style="${styles.table}">
 <tr>
 <th style="${styles.th}">Metric</th>
 <th style="${styles.th}">Outstanding Checklist</th>
 </tr>
 <tr>
 <td style="${styles.td}">Active Projects</td>
 <td style="${styles.td}">${projectsCount} ongoing</td>
 </tr>
 <tr>
 <td style="${styles.td}">Open RFIs Query count</td>
 <td style="${styles.td}">${openRfisCount} awaiting response</td>
 </tr>
 <tr>
 <td style="${styles.td}">Outstanding invoices</td>
 <td style="${styles.td}">${pendingPaymentsCount} awaiting payout</td>
 </tr>
 </table>
 <div style="text-align: center;">
 <a href="https://app.5bloc.com/dashboard" style="${styles.button}">LAUNCH MY WORKSPACE</a>
 </div>
 `)
}
