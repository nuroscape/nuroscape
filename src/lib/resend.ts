import { Resend } from "resend";
import { env } from "@/env";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendWelcomeEmail(
  to: string,
  magicLink: string
): Promise<void> {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "Votre rapport Nuroscape est prêt",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E8E4DC">
        <tr><td style="background:#1A7A65;padding:28px 40px">
          <p style="margin:0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.01em">Nuroscape</p>
        </td></tr>
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 16px;font-size:16px;color:#1c1e2a;line-height:1.6">Bonjour,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#4a4d5e;line-height:1.7">
            Votre rapport personnalisé est prêt. Cliquez sur le bouton ci-dessous
            pour y accéder — aucun mot de passe nécessaire.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="${magicLink}"
               style="display:inline-block;background:#1A7A65;color:#ffffff;font-size:15px;
                      font-weight:600;padding:14px 32px;border-radius:999px;text-decoration:none">
              Accéder à mon rapport
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:13px;color:#9397a6;line-height:1.5">
            Ce lien est valable 24 heures. Si vous n'avez pas demandé ce rapport,
            vous pouvez ignorer cet e-mail.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #E8E4DC">
          <p style="margin:0;font-size:12px;color:#9397a6">
            Nuroscape · nuroscape.com ·
            <a href="https://nuroscape.com/privacy" style="color:#9397a6">Confidentialité</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
