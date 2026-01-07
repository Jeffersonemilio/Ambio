# FASE 4 — PRODUÇÃO

## Objetivo

Preparar e lançar o sistema em produção com clientes piloto:
- Deploy no Railway
- Configuração de ambientes (staging/produção)
- Monitoramento e observabilidade
- Backup e disaster recovery
- Onboarding dos primeiros clientes

**Ao final desta fase**: sistema em produção com 20-30 clientes piloto.

---

## Pré-requisitos

- Fase 1 completa (Core Backend)
- Fase 2 completa (Alertas)
- Fase 3 completa (Auth + Multi-tenant)
- Testes automatizados passando
- Código revisado

---

## Entregas

### 1. Configuração de Ambientes

#### Ambientes

| Ambiente | Uso | URL |
|----------|-----|-----|
| Development | Local | localhost:3000 |
| Staging | Testes internos | staging.seudominio.com |
| Production | Clientes reais | api.seudominio.com |

#### Variáveis por Ambiente

```env
# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://...railway.app/staging
RABBITMQ_URL=amqp://...
LOG_LEVEL=debug

# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://...railway.app/production
RABBITMQ_URL=amqp://...
LOG_LEVEL=info
```

#### Tarefas

- [ ] Criar projeto no Railway
- [ ] Configurar PostgreSQL (Railway)
- [ ] Configurar RabbitMQ (CloudAMQP ou Railway)
- [ ] Configurar variáveis de ambiente
- [ ] Setup de domínio customizado
- [ ] Configurar SSL/TLS (automático no Railway)
- [ ] Criar ambiente de staging
- [ ] Criar ambiente de produção

---

### 2. Deploy no Railway

#### Estrutura de Serviços

```
Railway Project
├── api (Node.js)           # Aplicação principal
├── worker (Node.js)        # Consumers RabbitMQ
├── postgres (Database)     # PostgreSQL
└── (externo) CloudAMQP     # RabbitMQ
```

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

#### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/app.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

#### Tarefas

- [ ] Criar Dockerfile otimizado
- [ ] Configurar railway.json
- [ ] Setup de deploy automático (GitHub)
- [ ] Configurar health checks
- [ ] Configurar auto-scaling (se necessário)
- [ ] Testar rollback de deploy
- [ ] Documentar processo de deploy

---

### 3. CI/CD Pipeline

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api-staging

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api-production
```

#### Tarefas

- [ ] Configurar GitHub Actions
- [ ] Setup de secrets no GitHub
- [ ] Pipeline: lint → test → build → deploy staging
- [ ] Approval manual para produção
- [ ] Notificação de deploy (Slack/Discord)

---

### 4. Monitoramento e Observabilidade

#### Stack de Observabilidade

| Ferramenta | Uso | Custo |
|------------|-----|-------|
| Railway Metrics | Métricas básicas | Incluso |
| Pino + Logtail | Logs estruturados | Free tier |
| Sentry | Error tracking | Free tier |
| BetterStack | Uptime monitoring | Free tier |

#### Logging Estruturado

```typescript
// src/shared/logger/index.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version
  }
});

// Uso
logger.info({ tenantId, sensorId }, 'Reading processed');
logger.error({ err, tenantId }, 'Failed to process reading');
```

#### Métricas Customizadas

```typescript
// Métricas a rastrear
interface SystemMetrics {
  readings_processed_total: number;
  readings_per_minute: number;
  alerts_created_total: number;
  alerts_by_severity: Record<string, number>;
  api_latency_ms: number;
  queue_depth: number;
  active_sensors: number;
  active_tenants: number;
}
```

#### Tarefas

- [ ] Configurar Pino para logs estruturados
- [ ] Integrar Logtail (ou similar)
- [ ] Configurar Sentry para erros
- [ ] Setup de uptime monitoring
- [ ] Dashboard de métricas básicas
- [ ] Alertas de sistema (CPU, memória, erros)
- [ ] Log de auditoria (ações críticas)

---

### 5. Backup e Disaster Recovery

#### Estratégia de Backup

| Dado | Frequência | Retenção | Destino |
|------|------------|----------|---------|
| PostgreSQL | Diário | 30 dias | S3 |
| PostgreSQL | Semanal | 90 dias | S3 |
| Configurações | A cada deploy | Sempre | Git |

#### Backup Automático (Railway)

Railway faz backup automático do PostgreSQL. Configurar adicional:

```bash
# Script de backup manual (emergência)
#!/bin/bash
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
aws s3 cp backup_*.sql.gz s3://seu-bucket/backups/
```

#### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 4 horas
2. **RPO (Recovery Point Objective)**: 24 horas

**Procedimento de Recovery:**

1. Identificar a falha
2. Restaurar último backup válido
3. Verificar integridade dos dados
4. Reprocessar mensagens perdidas (RabbitMQ dead-letter)
5. Notificar clientes afetados

#### Tarefas

- [ ] Configurar backup automático (Railway)
- [ ] Backup adicional para S3 (opcional)
- [ ] Documentar processo de restore
- [ ] Testar restore de backup
- [ ] Criar runbook de disaster recovery
- [ ] Definir responsáveis por incidentes

---

### 6. Segurança em Produção

#### Checklist de Segurança

- [ ] HTTPS obrigatório (Railway automático)
- [ ] Headers de segurança (Helmet)
- [ ] Rate limiting configurado
- [ ] CORS restrito aos domínios permitidos
- [ ] Secrets em variáveis de ambiente (não no código)
- [ ] Logs não expõem dados sensíveis
- [ ] SQL injection prevenido (queries parametrizadas)
- [ ] XSS prevenido (sanitização de inputs)
- [ ] Senhas hasheadas (bcrypt)
- [ ] JWT com expiração curta
- [ ] API keys hasheadas no banco

#### Helmet Configuration

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

#### Tarefas

- [ ] Configurar Helmet
- [ ] Configurar CORS
- [ ] Rate limiting por IP e por API key
- [ ] Audit log de ações sensíveis
- [ ] Revisão de segurança do código
- [ ] Teste de penetração básico

---

### 7. Onboarding de Clientes Piloto

#### Processo de Onboarding

```
1. Contato comercial
       │
       ▼
2. Criar tenant (via admin)
       │
       ▼
3. Criar usuário ADMIN
       │
       ▼
4. Gerar API keys
       │
       ▼
5. Configurar sensores (mock)
       │
       ▼
6. Configurar regras de alerta
       │
       ▼
7. Treinamento básico
       │
       ▼
8. Go-live
```

#### Script de Setup de Tenant

```typescript
// scripts/setup-tenant.ts
async function setupTenant(data: {
  name: string;
  document: string;
  email: string;
  adminName: string;
  adminPassword: string;
}) {
  // 1. Criar tenant
  const tenant = await tenantService.create({
    name: data.name,
    document: data.document,
    email: data.email
  });

  // 2. Criar usuário admin
  const admin = await userService.create({
    tenant_id: tenant.id,
    email: data.email,
    name: data.adminName,
    password: data.adminPassword,
    role: 'ADMIN'
  });

  // 3. Gerar API key
  const apiKey = await apiKeyService.create({
    tenant_id: tenant.id,
    name: 'Produção'
  });

  // 4. Criar regras padrão
  await ruleService.createDefaultRules(tenant.id);

  return { tenant, admin, apiKey };
}
```

#### Tarefas

- [ ] Criar script de setup de tenant
- [ ] Documentação para cliente (API, alertas)
- [ ] Template de e-mail de boas-vindas
- [ ] Checklist de onboarding
- [ ] Suporte inicial (WhatsApp/Email)
- [ ] Coletar feedback dos pilotos

---

### 8. Documentação

#### Documentação Necessária

| Documento | Público | Conteúdo |
|-----------|---------|----------|
| API Reference | Clientes | Endpoints, autenticação, exemplos |
| Guia de Integração | Clientes | Como integrar sensores |
| Runbook | Interno | Procedimentos operacionais |
| Architecture | Interno | Decisões técnicas |

#### API Documentation (Swagger/OpenAPI)

```typescript
// Usar swagger-jsdoc + swagger-ui-express
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const specs = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IoT Sensores API',
      version: '1.0.0',
    },
    servers: [
      { url: 'https://api.seudominio.com', description: 'Produção' },
      { url: 'https://staging.seudominio.com', description: 'Staging' },
    ],
  },
  apis: ['./src/modules/**/**.controller.ts'],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
```

#### Tarefas

- [ ] Setup Swagger/OpenAPI
- [ ] Documentar todos os endpoints
- [ ] Guia de autenticação
- [ ] Exemplos de integração (cURL, Node.js)
- [ ] Runbook de operações
- [ ] FAQ para clientes

---

## Critérios de Conclusão

A Fase 4 está completa quando:

**Infraestrutura:**
1. [ ] Deploy automatizado funcionando
2. [ ] Staging e produção separados
3. [ ] SSL/HTTPS configurado
4. [ ] Domínio customizado ativo

**Monitoramento:**
5. [ ] Logs centralizados e pesquisáveis
6. [ ] Error tracking configurado
7. [ ] Uptime monitoring ativo
8. [ ] Alertas de sistema funcionando

**Segurança:**
9. [ ] Checklist de segurança completo
10. [ ] Rate limiting ativo
11. [ ] Headers de segurança configurados

**Operações:**
12. [ ] Backup funcionando
13. [ ] Runbook documentado
14. [ ] Processo de rollback testado

**Clientes:**
15. [ ] 5+ clientes piloto onboarded
16. [ ] Documentação da API disponível
17. [ ] Suporte funcionando
18. [ ] Feedback inicial coletado

---

## Dependências Adicionais

```json
{
  "dependencies": {
    "helmet": "^7.x",
    "@sentry/node": "^7.x",
    "swagger-ui-express": "^5.x",
    "swagger-jsdoc": "^6.x"
  },
  "devDependencies": {
    "@types/swagger-ui-express": "^4.x"
  }
}
```

---

## Variáveis de Ambiente (Produção)

```env
# App
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# RabbitMQ
RABBITMQ_URL=amqps://user:pass@host/vhost

# JWT
JWT_SECRET=chave-super-secreta-de-producao-256-bits
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
SMTP_FROM=noreply@seudominio.com

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
LOGTAIL_TOKEN=xxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Custos Estimados (Railway)

| Serviço | Plano | Custo/mês |
|---------|-------|-----------|
| API (Node.js) | Hobby | ~$5 |
| Worker (Node.js) | Hobby | ~$5 |
| PostgreSQL | Hobby | ~$5 |
| CloudAMQP (RabbitMQ) | Free/Little Lemur | $0-19 |
| Domínio | Anual | ~$12/ano |
| **Total** | | **~$15-35/mês** |

> Escala conforme uso. Railway cobra por consumo.

---

## Próxima Fase

Após completar a Fase 4, seguir para [Fase 5 — Frontend Web](fase-5-frontend.md).
