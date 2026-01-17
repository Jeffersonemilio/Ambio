/**
 * Templates de email centralizados
 * Cada template retorna { subject, html, text }
 */

const templates = {
  /**
   * Email de boas-vindas para novos usuários
   */
  welcome: (user, password, appName) => ({
    subject: `Bem-vindo à plataforma ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: #fff; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Olá, ${user.name}!</h2>
            <p>Sua conta foi criada com sucesso na plataforma ${appName}.</p>

            <div class="credentials">
              <p><strong>Email:</strong> ${user.email}</p>
              ${password ? `<p><strong>Senha:</strong> ${password}</p>` : ''}
            </div>

            ${password ? '<p><strong>Importante:</strong> Recomendamos que você altere sua senha no primeiro acesso.</p>' : ''}

            <p>Se você tiver alguma dúvida, entre em contato com nosso suporte.</p>

            <p>Atenciosamente,<br>Equipe ${appName}</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Olá, ${user.name}!

Sua conta foi criada com sucesso na plataforma ${appName}.

Email: ${user.email}
${password ? `Senha: ${password}` : ''}

${password ? 'Importante: Recomendamos que você altere sua senha no primeiro acesso.' : ''}

Se você tiver alguma dúvida, entre em contato com nosso suporte.

Atenciosamente,
Equipe ${appName}
    `.trim(),
  }),

  /**
   * Email de reset de senha
   */
  passwordReset: (user, resetLink, appName) => ({
    subject: `Redefinição de senha - ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .warning { background: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Redefinição de Senha</h2>
            <p>Olá, ${user.name}!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>

            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Redefinir Senha</a>
            </p>

            <div class="warning">
              <p><strong>Atenção:</strong> Este link expira em 1 hora.</p>
              <p>Se você não solicitou essa redefinição, ignore este email.</p>
            </div>

            <p>Atenciosamente,<br>Equipe ${appName}</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Olá, ${user.name}!

Recebemos uma solicitação para redefinir a senha da sua conta.

Clique no link abaixo para redefinir sua senha:
${resetLink}

Atenção: Este link expira em 1 hora.
Se você não solicitou essa redefinição, ignore este email.

Atenciosamente,
Equipe ${appName}
    `.trim(),
  }),

  /**
   * Email de senha temporária (reset por admin)
   */
  tempPassword: (user, tempPassword, appName) => ({
    subject: `Nova senha temporária - ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: #fff; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          .warning { background: #fee2e2; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Senha Redefinida</h2>
            <p>Olá, ${user.name}!</p>
            <p>Um administrador redefiniu a senha da sua conta.</p>

            <div class="credentials">
              <p><strong>Nova senha temporária:</strong> ${tempPassword}</p>
            </div>

            <div class="warning">
              <p><strong>Importante:</strong> Por segurança, altere sua senha imediatamente após o login.</p>
            </div>

            <p>Atenciosamente,<br>Equipe ${appName}</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Olá, ${user.name}!

Um administrador redefiniu a senha da sua conta.

Nova senha temporária: ${tempPassword}

Importante: Por segurança, altere sua senha imediatamente após o login.

Atenciosamente,
Equipe ${appName}
    `.trim(),
  }),
};

module.exports = templates;
