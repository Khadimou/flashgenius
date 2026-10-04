import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendWelcomeEmail(to: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Welcome Email] Would send to: ${to}`)
    return
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'FlashGenius <noreply@flashgenius.app>',
    to,
    subject: 'FlashGenius est en ligne — ton accès beta est prêt 🚀',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;background:#050510;color:#fff;border-radius:16px">
        <div style="font-size:26px;font-weight:900;color:#a78bfa;margin-bottom:4px">⚡ FlashGenius</div>
        <p style="color:#6b7280;font-size:13px;margin-top:0;margin-bottom:32px">Ton outil de mémorisation par IA</p>

        <p style="color:#d1d5db;line-height:1.6;margin-bottom:16px">
          Tu t'es inscrit(e) sur FlashGenius, et j'ai une bonne nouvelle :
          <strong style="color:#fff">la version beta est prête.</strong>
        </p>

        <p style="color:#d1d5db;line-height:1.6;margin-bottom:24px">
          FlashGenius transforme tes cours ou notes en flashcards grâce à l'IA,
          avec un système de révision espacée (algorithme SM-2) pour mémoriser efficacement sur le long terme.
        </p>

        <div style="background:#0f0f1a;border:1px solid #1f1f3a;border-radius:12px;padding:20px;margin-bottom:28px">
          <p style="color:#a78bfa;font-weight:700;margin:0 0 12px 0;font-size:14px">Comment accéder ?</p>
          <ol style="color:#d1d5db;padding-left:20px;margin:0;line-height:2">
            <li>Va sur <a href="https://flashgenius-rho.vercel.app/app" style="color:#7c3aed">flashgenius-rho.vercel.app/app</a></li>
            <li>Entre <strong style="color:#fff">cette adresse email</strong></li>
            <li>Clique sur le lien magique reçu — pas de mot de passe</li>
          </ol>
        </div>

        <div style="background:#0f0f1a;border:1px solid #1f1f3a;border-radius:12px;padding:20px;margin-bottom:28px">
          <p style="color:#a78bfa;font-weight:700;margin:0 0 12px 0;font-size:14px">Ce que tu peux faire</p>
          <ul style="color:#d1d5db;padding-left:20px;margin:0;line-height:2">
            <li>Générer des flashcards depuis tes cours (IA)</li>
            <li>Réviser en mode classique ou révision espacée SM-2</li>
            <li>Organiser tes decks par dossier</li>
            <li>Exporter en CSV ou PDF</li>
          </ul>
        </div>

        <a href="https://flashgenius-rho.vercel.app/app"
          style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:32px">
          Accéder à FlashGenius →
        </a>

        <p style="color:#6b7280;font-size:13px;line-height:1.6;border-top:1px solid #1f1f3a;padding-top:20px;margin-top:8px">
          C'est une beta — tout retour est précieux. Réponds directement à ce mail pour me donner ton avis.<br>
          Bonne révision ! 🧠<br><br>
          <strong style="color:#9ca3af">Khadimou</strong>
        </p>
      </div>
    `,
  })
}
