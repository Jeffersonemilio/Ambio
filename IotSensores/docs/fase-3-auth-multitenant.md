# FASE 3 — AUTENTICAÇÃO E MULTI-TENANT

## Objetivo

Implementar sistema de autenticação e isolamento completo entre tenants:
- Autenticação JWT para usuários
- Controle de acesso baseado em roles (2 níveis)
- Isolamento total de dados entre tenants
- Painel administrativo do SaaS
- API segura para produção

**Ao final desta fase**: sistema pronto para múltiplos clientes com dados isolados + gestão do SaaS.

---

## Estrutura de Acesso (2 Níveis)

```
┌─────────────────────────────────────────────────────────────┐
│                    NÍVEL PLATAFORMA (SaaS)                  │
│                 Gestão do negócio como um todo              │
│                                                             │
│  SUPER_ADMIN    - Dono do SaaS (acesso total)              │
│  SUPPORT        - Suporte técnico                           │
│  FINANCE        - Financeiro/Billing                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ gerencia múltiplos
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NÍVEL TENANT (Cliente)                   │
│                    Cada cliente do SaaS                     │
│                                                             │
│  ADMIN          - Admin do cliente                          │
│  OPERATOR       - Operador                                  │
│  VIEWER         - Apenas visualização                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Pré-requisitos

- Fase 1 completa (CRUD tenant, sensor, reading)
- Fase 2 completa (alerts, rules, notifications)
- PostgreSQL operacional

---

## Entregas

### 1. Módulo Platform Admin (Gestão SaaS)

**Responsabilidade**: Administração da plataforma como um todo

#### Entidade PlatformUser

```typescript
interface PlatformUser {
  id: string;                    // UUID
  email: string;                 // Único global
  password_hash: string;         // bcrypt hash
  name: string;
  role: PlatformRole;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',   // Acesso total ao SaaS
  SUPPORT = 'SUPPORT',           // Suporte técnico
  FINANCE = 'FINANCE'            // Financeiro
}
```

#### Permissões por Role (Plataforma)

| Recurso | SUPER_ADMIN | SUPPORT | FINANCE |
|---------|-------------|---------|---------|
| **Tenants** |
| Criar tenant | X | - | - |
| Editar tenant | X | X | - |
| Suspender/Ativar tenant | X | - | - |
| Deletar tenant | X | - | - |
| Ver todos os tenants | X | X | X |
| **Usuários Plataforma** |
| Gerenciar platform users | X | - | - |
| **Suporte** |
| Acessar dados de tenant (read-only) | X | X | - |
| Impersonar usuário de tenant | X | X | - |
| Ver logs de sistema | X | X | - |
| **Financeiro** |
| Ver faturamento | X | - | X |
| Gerenciar planos | X | - | X |
| Aplicar descontos | X | - | X |
| Ver métricas financeiras | X | - | X |
| **Sistema** |
| Configurações globais | X | - | - |
| Ver métricas do sistema | X | X | X |
| Manutenção (migrations, etc) | X | - | - |

#### Tarefas

- [ ] Criar migration `008_create_platform_users_table`
- [ ] Criar `platform-user.entity.ts`
- [ ] Criar `platform-user.repository.ts`
- [ ] Criar `platform-user.service.ts`
- [ ] Criar `platform-auth.controller.ts`
- [ ] Criar `platform-admin.controller.ts`
- [ ] Seed: criar SUPER_ADMIN inicial
- [ ] Testes unitários

#### Endpoints (Admin)

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| POST | /admin/auth/login | - | - | Login plataforma |
| POST | /admin/auth/refresh | - | - | Refresh token |
| GET | /admin/users | JWT | SUPER_ADMIN | Listar platform users |
| POST | /admin/users | JWT | SUPER_ADMIN | Criar platform user |
| PUT | /admin/users/:id | JWT | SUPER_ADMIN | Editar platform user |
| DELETE | /admin/users/:id | JWT | SUPER_ADMIN | Desativar |
| GET | /admin/tenants | JWT | ANY | Listar todos tenants |
| POST | /admin/tenants | JWT | SUPER_ADMIN | Criar tenant |
| GET | /admin/tenants/:id | JWT | ANY | Detalhes do tenant |
| PUT | /admin/tenants/:id | JWT | SUPER_ADMIN, SUPPORT | Editar tenant |
| POST | /admin/tenants/:id/suspend | JWT | SUPER_ADMIN | Suspender tenant |
| POST | /admin/tenants/:id/activate | JWT | SUPER_ADMIN | Ativar tenant |
| GET | /admin/tenants/:id/impersonate | JWT | SUPER_ADMIN, SUPPORT | Gerar token de acesso |
| GET | /admin/metrics | JWT | ANY | Métricas do sistema |
| GET | /admin/billing | JWT | SUPER_ADMIN, FINANCE | Dashboard financeiro |

---

### 2. Módulo User (Nível Tenant)

**Responsabilidade**: Gerenciar usuários dos clientes

#### Entidade User

```typescript
interface User {
  id: string;                    // UUID
  tenant_id: string;             // FK tenant
  email: string;                 // Único por tenant
  password_hash: string;         // bcrypt hash
  name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

enum UserRole {
  ADMIN = 'ADMIN',           // Acesso total ao tenant
  OPERATOR = 'OPERATOR',     // Gerencia sensores e alertas
  VIEWER = 'VIEWER'          // Apenas visualização
}
```

#### Permissões por Role (Tenant)

| Recurso | ADMIN | OPERATOR | VIEWER |
|---------|-------|----------|--------|
| Ver dashboard | X | X | X |
| Ver leituras | X | X | X |
| Ver alertas | X | X | X |
| Acknowledge alertas | X | X | - |
| Gerenciar sensores | X | X | - |
| Gerenciar regras | X | X | - |
| Gerenciar usuários | X | - | - |
| Configurar tenant | X | - | - |
| Ver API keys | X | - | - |
| Gerar API keys | X | - | - |

#### Tarefas

- [ ] Criar migration `009_create_users_table`
- [ ] Criar índice único `(tenant_id, email)`
- [ ] Criar `user.entity.ts`
- [ ] Criar `user.repository.ts`
- [ ] Criar `user.service.ts`
- [ ] Criar `user.controller.ts`
- [ ] Hash de senha com bcrypt (salt rounds: 12)
- [ ] Método `findByEmail(tenantId, email)`
- [ ] Método `validatePassword(user, password)`
- [ ] Seed: criar usuário admin para tenant de teste
- [ ] Testes unitários

#### Endpoints

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | /api/users | JWT | ADMIN | Listar usuários do tenant |
| GET | /api/users/:id | JWT | ADMIN | Buscar usuário |
| POST | /api/users | JWT | ADMIN | Criar usuário |
| PUT | /api/users/:id | JWT | ADMIN | Atualizar usuário |
| DELETE | /api/users/:id | JWT | ADMIN | Desativar usuário |
| GET | /api/users/me | JWT | ANY | Perfil do usuário logado |
| PUT | /api/users/me | JWT | ANY | Atualizar próprio perfil |

---

### 2. Módulo Auth

**Responsabilidade**: Autenticação e gestão de tokens JWT

#### Fluxo de Autenticação

```
┌─────────────────┐
│ POST /auth/login│
│ email + password│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validar credenc.│
│ (bcrypt compare)│
└────────┬────────┘
         │
    ┌────┴────┐
    │ Válido? │
    └────┬────┘
         │
   ┌─────┴─────┐
  Não         Sim
   │           │
   ▼           ▼
┌─────────┐  ┌──────────────────┐
│ 401     │  │ Gerar JWT        │
│ Unauth. │  │ access + refresh │
└─────────┘  └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Retornar tokens  │
             │ + user info      │
             └──────────────────┘
```

#### JWT Payload

```typescript
interface JwtPayload {
  sub: string;        // user_id
  tenant_id: string;  // tenant_id
  email: string;
  role: UserRole;
  iat: number;        // issued at
  exp: number;        // expiration
}
```

#### Tokens

| Token | Duração | Uso |
|-------|---------|-----|
| Access Token | 15 minutos | Autenticação de requests |
| Refresh Token | 7 dias | Renovar access token |

#### Tarefas

- [ ] Criar `auth.service.ts`
- [ ] Criar `auth.controller.ts`
- [ ] Implementar login (email + password)
- [ ] Gerar JWT com jsonwebtoken
- [ ] Implementar refresh token
- [ ] Criar migration `009_create_refresh_tokens_table`
- [ ] Implementar logout (invalidar refresh token)
- [ ] Rate limiting no login (5 tentativas/minuto)
- [ ] Testes unitários

#### Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | /auth/login | - | Login com email/senha |
| POST | /auth/refresh | - | Renovar access token |
| POST | /auth/logout | JWT | Invalidar refresh token |
| POST | /auth/forgot-password | - | Solicitar reset (futuro) |
| POST | /auth/reset-password | - | Resetar senha (futuro) |

#### Resposta do Login

```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "expires_in": 900,
  "token_type": "Bearer",
  "user": {
    "id": "uuid",
    "email": "user@empresa.com",
    "name": "João Silva",
    "role": "ADMIN",
    "tenant": {
      "id": "uuid",
      "name": "Empresa XYZ"
    }
  }
}
```

---

### 3. Middleware de Autenticação

**Responsabilidade**: Proteger rotas e injetar contexto do usuário

#### Auth Middleware

```typescript
// src/shared/middleware/auth.middleware.ts
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tenant_id: string;
    email: string;
    role: UserRole;
  };
}

async function authMiddleware(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
```

#### Role Middleware

```typescript
// src/shared/middleware/role.middleware.ts
function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

// Uso:
router.delete('/users/:id', authMiddleware, requireRole('ADMIN'), userController.delete);
```

#### Tarefas

- [ ] Criar `auth.middleware.ts`
- [ ] Criar `role.middleware.ts`
- [ ] Helper `extractBearerToken()`
- [ ] Injetar `req.user` em todas as rotas autenticadas
- [ ] Testes de middleware

---

### 4. Tenant Isolation

**Responsabilidade**: Garantir que cada tenant só acessa seus dados

#### Estratégia: Filtro por tenant_id

Todas as queries incluem `WHERE tenant_id = ?` automaticamente.

```typescript
// src/shared/middleware/tenant.middleware.ts
function tenantMiddleware(req: AuthenticatedRequest, res, next) {
  // Injeta tenant_id no contexto para uso nos repositories
  req.tenantContext = {
    tenant_id: req.user.tenant_id
  };
  next();
}
```

#### Repository Base com Tenant

```typescript
// src/shared/database/tenant-repository.base.ts
abstract class TenantRepository<T> implements IRepository<T> {
  constructor(
    protected readonly db: IDatabase,
    protected readonly tableName: string
  ) {}

  async findById(id: string, tenantId: string): Promise<T | null> {
    return this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
  }

  async findAll(tenantId: string, filters?: object): Promise<T[]> {
    return this.db.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
    );
  }

  // Todos os métodos recebem tenantId obrigatoriamente
}
```

#### Tarefas

- [ ] Criar `tenant.middleware.ts`
- [ ] Criar `TenantRepository` base class
- [ ] Refatorar todos os repositories para usar tenant_id
- [ ] Adicionar `tenant_id` em todas as tabelas (se não existir)
- [ ] Criar índices compostos `(tenant_id, ...)`
- [ ] Testes de isolamento

#### Teste de Isolamento

```typescript
describe('Tenant Isolation', () => {
  it('should not allow access to other tenant data', async () => {
    // Tenant A cria sensor
    const sensorA = await sensorService.create(tenantAId, { ... });

    // Tenant B tenta acessar sensor de A
    const result = await sensorService.findById(sensorA.id, tenantBId);

    expect(result).toBeNull(); // Não encontra!
  });
});
```

---

### 5. Proteção de Rotas

#### Mapa de Rotas

| Rota | Auth | Tenant | Roles |
|------|------|--------|-------|
| POST /ingest | API Key | - | - |
| POST /auth/* | - | - | - |
| GET /health/* | - | - | - |
| GET /api/tenants/* | JWT | - | SUPER_ADMIN |
| GET /api/sensors/* | JWT | X | ANY |
| POST /api/sensors | JWT | X | ADMIN, OPERATOR |
| GET /api/readings/* | JWT | X | ANY |
| GET /api/alerts/* | JWT | X | ANY |
| PATCH /api/alerts/*/acknowledge | JWT | X | ADMIN, OPERATOR |
| GET /api/rules/* | JWT | X | ANY |
| POST /api/rules | JWT | X | ADMIN, OPERATOR |
| GET /api/users/* | JWT | X | ADMIN |

#### Autenticação do Ingest (Sensores)

Os sensores usam **API Key** ao invés de JWT:

```typescript
// Header: X-API-Key: <sensor_api_key>

interface SensorApiKey {
  id: string;
  tenant_id: string;
  key_hash: string;      // SHA256 da key
  name: string;          // "Sensor Produção"
  is_active: boolean;
  last_used_at: Date;
  created_at: Date;
}
```

#### Tarefas

- [ ] Criar migration `010_create_api_keys_table`
- [ ] Criar `api-key.service.ts`
- [ ] Criar middleware `apiKeyAuth.middleware.ts`
- [ ] Endpoint para gerar/revogar API keys
- [ ] Rate limiting por API key
- [ ] Atualizar `/ingest` para usar API key

---

### 6. Atualizar Controllers Existentes

Todos os controllers precisam usar o contexto de autenticação.

#### Exemplo: SensorController Atualizado

```typescript
// ANTES
async list(req, res) {
  const sensors = await sensorService.findAll();
  res.json(sensors);
}

// DEPOIS
async list(req: AuthenticatedRequest, res) {
  const sensors = await sensorService.findByTenant(req.user.tenant_id);
  res.json(sensors);
}
```

#### Tarefas

- [ ] Atualizar `sensor.controller.ts`
- [ ] Atualizar `reading.controller.ts`
- [ ] Atualizar `alert.controller.ts`
- [ ] Atualizar `rule.controller.ts`
- [ ] Atualizar `notification.controller.ts`
- [ ] Adicionar auth middleware em todas as rotas `/api/*`
- [ ] Testes de integração

---

## Migrations (ordem)

8. `008_create_platform_users_table.sql`
9. `009_create_users_table.sql`
10. `010_create_refresh_tokens_table.sql`
11. `011_create_api_keys_table.sql`

---

## Testes

### Unitários

- [ ] platform-user.service.spec.ts
- [ ] platform-auth.service.spec.ts
- [ ] auth.service.spec.ts
- [ ] user.service.spec.ts
- [ ] auth.middleware.spec.ts
- [ ] role.middleware.spec.ts
- [ ] tenant.middleware.spec.ts

### Integração

**Nível Plataforma:**
- [ ] Login platform user com credenciais válidas → tokens
- [ ] SUPER_ADMIN pode criar tenant
- [ ] SUPPORT pode ver tenant mas não criar
- [ ] FINANCE acessa billing mas não tenants
- [ ] Impersonate gera token válido do tenant

**Nível Tenant:**
- [ ] Login com credenciais válidas → tokens
- [ ] Login com credenciais inválidas → 401
- [ ] Acesso a rota protegida sem token → 401
- [ ] Acesso a rota protegida com token expirado → 401
- [ ] Refresh token → novo access token
- [ ] Tenant A não acessa dados de Tenant B
- [ ] Role VIEWER não pode criar sensor
- [ ] Role ADMIN pode criar usuário

### Cenários de Teste

```typescript
describe('Auth', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'senha123' });

    expect(response.status).toBe(200);
    expect(response.body.access_token).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'senhaerrada' });

    expect(response.status).toBe(401);
  });
});

describe('Authorization', () => {
  it('should deny VIEWER from creating sensor', async () => {
    const response = await request(app)
      .post('/api/sensors')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ serial_number: 'TEST001', name: 'Test' });

    expect(response.status).toBe(403);
  });
});
```

---

## Critérios de Conclusão

A Fase 3 está completa quando:

**Nível Plataforma:**
1. [ ] CRUD de platform users funciona
2. [ ] Login admin (`/admin/auth/login`) retorna JWT
3. [ ] Roles SUPER_ADMIN, SUPPORT, FINANCE funcionam
4. [ ] Impersonate de tenant funciona
5. [ ] Dashboard admin lista todos tenants

**Nível Tenant:**
6. [ ] CRUD de usuários do tenant funciona
7. [ ] Login (`/auth/login`) retorna JWT válido
8. [ ] Refresh token funciona
9. [ ] Rotas protegidas exigem autenticação
10. [ ] Roles ADMIN, OPERATOR, VIEWER funcionam
11. [ ] Tenant isolation funciona (dados isolados)
12. [ ] API Key funciona para /ingest
13. [ ] Testes de segurança passando

---

## Dependências Adicionais

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.x",
    "bcrypt": "^5.x",
    "express-rate-limit": "^7.x"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.x",
    "@types/bcrypt": "^5.x"
  }
}
```

---

## Variáveis de Ambiente

```env
# JWT
JWT_SECRET=sua-chave-secreta-muito-longa-e-segura
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5
```

---

## Segurança Checklist

- [ ] Senhas hasheadas com bcrypt (salt rounds >= 12)
- [ ] JWT com expiração curta (15min)
- [ ] Refresh token com rotação
- [ ] Rate limiting em login
- [ ] HTTPS obrigatório em produção
- [ ] Headers de segurança (helmet)
- [ ] CORS configurado corretamente
- [ ] Logs de tentativas de login falhas
- [ ] API keys hasheadas no banco

---

## Próxima Fase

Após completar a Fase 3, seguir para [Fase 4 — Produção](fase-4-producao.md).
