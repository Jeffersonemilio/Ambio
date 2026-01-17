# Módulo de Email (useSend)

Módulo portátil para envio de emails usando [useSend](https://usesend.com).

## Estrutura

```
email/
├── index.js           # Entry point
├── email.service.js   # Lógica de envio
├── email.config.js    # Configuração
├── email.templates.js # Templates HTML/texto
└── README.md          # Este arquivo
```

## Instalação

```bash
npm install usesend-js
```

## Configuração

Adicione as variáveis de ambiente no seu `.env`:

```env
USESEND_API_KEY=us_your_api_key
USESEND_URL=https://your-usesend-server.com
USESEND_FROM_EMAIL=noreply@yourdomain.com
APP_NAME=SuaApp  # opcional, default: "Ambio"
```

## Uso Básico

```javascript
const { emailService } = require('./modules/email');

// Email de boas-vindas (com senha)
await emailService.sendWelcome(user, 'senha123');

// Email de boas-vindas (sem senha)
await emailService.sendWelcome(user);

// Email de reset de senha
await emailService.sendPasswordReset(user, 'https://app.com/reset?token=abc');

// Email de senha temporária
await emailService.sendTempPassword(user, 'temp123');

// Email genérico
await emailService.send({
  to: 'user@email.com',
  subject: 'Assunto',
  html: '<p>Conteúdo HTML</p>',
  text: 'Conteúdo texto',
});
```

## Uso com Config Customizada

```javascript
const { EmailService } = require('./modules/email');

const customService = new EmailService({
  apiKey: 'us_custom_key',
  url: 'https://custom-server.com',
  fromEmail: 'custom@domain.com',
  appName: 'OutroApp',
});

await customService.sendWelcome(user, password);
```

## Templates Disponíveis

| Template | Método | Descrição |
|----------|--------|-----------|
| `welcome` | `sendWelcome(user, password?)` | Boas-vindas ao novo usuário |
| `passwordReset` | `sendPasswordReset(user, resetLink)` | Link para reset de senha |
| `tempPassword` | `sendTempPassword(user, tempPassword)` | Senha temporária (reset por admin) |

## Portabilidade

Para usar em outro projeto:

1. Copie a pasta `email/` inteira
2. Instale a dependência: `npm install usesend-js`
3. Configure as variáveis de ambiente
4. Importe e use: `const { emailService } = require('./path/to/email')`

## Comportamento sem Configuração

Se as variáveis de ambiente não estiverem configuradas:
- O módulo **não quebra** a aplicação
- Loga um warning: `[Email] Cliente não configurado - email não enviado`
- Retorna `{ success: false, error: 'Email não configurado' }`
