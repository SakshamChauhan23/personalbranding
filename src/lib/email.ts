import nodemailer from 'nodemailer'

interface SendEmailOptions {
    to: string
    subject: string
    html: string
    text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
    // Check if we have real SMTP credentials
    const hasRealSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS

    let transporter;

    if (hasRealSMTP) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Boolean(process.env.SMTP_SECURE) || false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })
    } else {
        // Fallback to Ethereal for development
        console.log('No SMTP credentials found. Using Ethereal for testing.')
        const testAccount = await nodemailer.createTestAccount()
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        })
    }

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"SocialRipple" <no-reply@socialripple.ai>',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''), // Simple strip tags for text fallback
    })

    console.log("Message sent: %s", info.messageId)

    if (!hasRealSMTP) {
        const previewUrl = nodemailer.getTestMessageUrl(info)
        console.log("Preview URL: %s", previewUrl)
        return { success: true, messageId: info.messageId, previewUrl }
    }

    return { success: true, messageId: info.messageId }
}
