# FASE 2 — REGRAS E ALERTAS

## Objetivo

Criar o sistema de regras e alertas que reage aos dados recebidos:
- Avaliar leituras contra regras configuradas
- Gerar alertas quando condições são violadas
- Notificar usuários via e-mail

**Ao final desta fase**: o sistema detecta anomalias e envia alertas automaticamente.

---

## Pré-requisitos

- Fase 1 completa (ingest + readings funcionando)
- PostgreSQL + RabbitMQ operacionais
- Dados sendo persistidos no banco

---

## Entregas

### 1. Módulo Alert

**Responsabilidade**: Gerenciar alertas gerados pelo sistema

#### Entidade Alert

```typescript
interface Alert {
  id: string;                    // UUID
  tenant_id: string;             // FK tenant
  sensor_id: string;             // FK sensor
  reading_id: string;            // FK reading que disparou
  rule_id: string;               // FK rule violada
  type: AlertType;               // TEMPERATURE | HUMIDITY | BATTERY | OFFLINE
  severity: AlertSeverity;       // INFO | WARNING | CRITICAL
  status: AlertStatus;           // OPEN | ACKNOWLEDGED | RESOLVED
  title: string;                 // "Temperatura acima do limite"
  message: string;               // Detalhes do alerta
  value: number;                 // Valor que disparou (ex: 28.5)
  threshold: number;             // Limite configurado (ex: 25.0)
  triggered_at: Date;            // Quando disparou
  acknowledged_at: Date | null;  // Quando foi reconhecido
  acknowledged_by: string | null;// User ID
  resolved_at: Date | null;      // Quando foi resolvido
  metadata: object;              // JSONB extras
  created_at: Date;
  updated_at: Date;
}

enum AlertType {
  TEMPERATURE_HIGH = 'TEMPERATURE_HIGH',
  TEMPERATURE_LOW = 'TEMPERATURE_LOW',
  HUMIDITY_HIGH = 'HUMIDITY_HIGH',
  HUMIDITY_LOW = 'HUMIDITY_LOW',
  BATTERY_LOW = 'BATTERY_LOW',
  BATTERY_CRITICAL = 'BATTERY_CRITICAL',
  SENSOR_OFFLINE = 'SENSOR_OFFLINE'
}

enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

enum AlertStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED'
}
```

#### Tarefas

- [ ] Criar migration `004_create_alerts_table`
- [ ] Criar índices: `(tenant_id, status)`, `(sensor_id, triggered_at)`
- [ ] Criar `alert.entity.ts`
- [ ] Criar `alert.repository.ts`
- [ ] Criar `alert.service.ts`
- [ ] Criar `alert.controller.ts`
- [ ] Método `createFromReading(reading, rule, violation)`
- [ ] Método `acknowledge(alertId, userId)`
- [ ] Método `resolve(alertId)`
- [ ] Método `findOpenBySensor(sensorId)`
- [ ] Método `findByTenant(tenantId, filters)`
- [ ] Testes unitários

#### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/alerts | Listar alertas (com filtros) |
| GET | /api/alerts/:id | Buscar alerta por ID |
| GET | /api/alerts/sensor/:id | Alertas de um sensor |
| GET | /api/alerts/open | Alertas em aberto |
| PATCH | /api/alerts/:id/acknowledge | Reconhecer alerta |
| PATCH | /api/alerts/:id/resolve | Resolver alerta |

---

### 2. Módulo Rule

**Responsabilidade**: Gerenciar regras de monitoramento por sensor/tenant

#### Entidade Rule

```typescript
interface Rule {
  id: string;                    // UUID
  tenant_id: string;             // FK tenant
  sensor_id: string | null;      // FK sensor (null = aplica a todos do tenant)
  name: string;                  // "Limite temperatura geladeira"
  type: RuleType;                // TEMPERATURE | HUMIDITY | BATTERY
  condition: RuleCondition;      // ABOVE | BELOW | EQUALS | BETWEEN
  threshold_min: number | null;  // Limite inferior
  threshold_max: number | null;  // Limite superior
  severity: AlertSeverity;       // Severidade do alerta gerado
  is_active: boolean;
  cooldown_minutes: number;      // Tempo mínimo entre alertas (evita spam)
  created_at: Date;
  updated_at: Date;
}

enum RuleType {
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  BATTERY = 'BATTERY'
}

enum RuleCondition {
  ABOVE = 'ABOVE',      // valor > threshold_max
  BELOW = 'BELOW',      // valor < threshold_min
  BETWEEN = 'BETWEEN',  // threshold_min <= valor <= threshold_max (ok)
  OUTSIDE = 'OUTSIDE'   // valor < threshold_min OR valor > threshold_max
}
```

#### Tarefas

- [ ] Criar migration `005_create_rules_table`
- [ ] Criar `rule.entity.ts`
- [ ] Criar `rule.repository.ts`
- [ ] Criar `rule.service.ts`
- [ ] Criar `rule.controller.ts`
- [ ] Método `findBySensor(sensorId)` — inclui regras do tenant
- [ ] Método `findByTenant(tenantId)`
- [ ] Testes unitários

#### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/rules | Criar regra |
| GET | /api/rules | Listar regras |
| GET | /api/rules/:id | Buscar por ID |
| PUT | /api/rules/:id | Atualizar regra |
| DELETE | /api/rules/:id | Desativar regra |
| GET | /api/rules/sensor/:id | Regras de um sensor |

---

### 3. Rules Engine

**Responsabilidade**: Avaliar leituras contra regras e disparar alertas

#### Fluxo

```
Reading persistida
       │
       ▼
┌─────────────────────────┐
│ RulesEngine.evaluate()  │
│ - Busca regras ativas   │
│ - Avalia cada regra     │
│ - Verifica cooldown     │
└───────────┬─────────────┘
            │
      ┌─────┴─────┐
      │ Violação? │
      └─────┬─────┘
            │
      ┌─────┴─────┐
     Não         Sim
      │           │
      ▼           ▼
   (nada)    ┌────────────────┐
             │ Criar Alert    │
             │ Publicar evento│
             │ alerts.created │
             └────────────────┘
```

#### Interface

```typescript
interface IRulesEngine {
  evaluate(reading: Reading): Promise<Alert[]>;
}

interface RuleViolation {
  rule: Rule;
  reading: Reading;
  actualValue: number;
  threshold: number;
  message: string;
}
```

#### Tarefas

- [ ] Criar `rules-engine.service.ts`
- [ ] Implementar avaliação de regras de temperatura
- [ ] Implementar avaliação de regras de umidade
- [ ] Implementar avaliação de bateria (LOW, CRITICAL)
- [ ] Implementar lógica de cooldown (evitar spam)
- [ ] Criar tabela `alert_cooldowns` para tracking
- [ ] Integrar no fluxo do `reading.consumer.ts`
- [ ] Publicar evento `alerts.created` no RabbitMQ
- [ ] Testes unitários com diferentes cenários

#### Regras Padrão (Seed)

```typescript
// Regras default criadas para todo novo tenant
const defaultRules = [
  {
    name: 'Bateria baixa',
    type: 'BATTERY',
    condition: 'BELOW',
    threshold_min: 30,
    severity: 'WARNING',
    cooldown_minutes: 1440 // 24h
  },
  {
    name: 'Bateria crítica',
    type: 'BATTERY',
    condition: 'BELOW',
    threshold_min: 10,
    severity: 'CRITICAL',
    cooldown_minutes: 360 // 6h
  }
];
```

---

### 4. Módulo Notification

**Responsabilidade**: Enviar notificações para os usuários

#### Interface

```typescript
interface INotificationProvider {
  send(notification: Notification): Promise<void>;
}

interface Notification {
  type: 'EMAIL' | 'SMS' | 'PUSH';
  recipient: string;
  subject: string;
  body: string;
  data?: object;
}
```

#### Email Provider (MVP)

```typescript
// Usando Nodemailer ou serviço como Resend/SendGrid
interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}
```

#### Tarefas

- [ ] Criar `notification.service.ts`
- [ ] Criar interface `INotificationProvider`
- [ ] Criar `email.provider.ts` (Nodemailer)
- [ ] Criar templates de e-mail (HTML básico)
- [ ] Criar consumer `notification.consumer.ts`
- [ ] Consumir fila `notifications.send`
- [ ] Log de notificações enviadas
- [ ] Testes com mock do provider

#### Templates de E-mail

| Template | Uso |
|----------|-----|
| `alert-critical.html` | Alerta crítico |
| `alert-warning.html` | Alerta de aviso |
| `daily-summary.html` | Resumo diário (futuro) |

---

### 5. Integração no Fluxo

#### Atualizar Reading Consumer

```typescript
// reading.consumer.ts - atualizado
async function processReading(data: IngestPayload) {
  // 1. Persistir reading (já existe)
  const reading = await readingService.create(data);

  // 2. [NOVO] Avaliar regras
  const alerts = await rulesEngine.evaluate(reading);

  // 3. [NOVO] Enfileirar notificações
  for (const alert of alerts) {
    await queue.publish('notifications.send', {
      alertId: alert.id,
      tenantId: alert.tenant_id
    });
  }
}
```

#### Nova Fila: notifications.send

```typescript
// notification.consumer.ts
async function processNotification(data: { alertId: string, tenantId: string }) {
  const alert = await alertService.findById(data.alertId);
  const tenant = await tenantService.findById(data.tenantId);

  // Buscar destinatários (por enquanto, email do tenant)
  const recipients = [tenant.email];

  for (const recipient of recipients) {
    await notificationService.send({
      type: 'EMAIL',
      recipient,
      subject: `[${alert.severity}] ${alert.title}`,
      body: renderTemplate(alert)
    });
  }
}
```

---

### 6. Detecção de Sensor Offline

**Objetivo**: Alertar quando sensor para de enviar dados

#### Abordagem

Job agendado que verifica `last_reading_at` de cada sensor.

```typescript
// jobs/check-offline-sensors.ts
async function checkOfflineSensors() {
  const threshold = new Date(Date.now() - 30 * 60 * 1000); // 30 min

  const offlineSensors = await sensorRepository.findOffline(threshold);

  for (const sensor of offlineSensors) {
    // Verificar se já existe alerta OPEN de offline
    const existingAlert = await alertService.findOpenBySensor(sensor.id, 'SENSOR_OFFLINE');

    if (!existingAlert) {
      await alertService.create({
        type: 'SENSOR_OFFLINE',
        severity: 'WARNING',
        sensor_id: sensor.id,
        tenant_id: sensor.tenant_id,
        title: `Sensor ${sensor.name} offline`,
        message: `Última leitura: ${sensor.last_reading_at}`
      });
    }
  }
}
```

#### Tarefas

- [ ] Criar job `check-offline-sensors.ts`
- [ ] Configurar cron (a cada 5 minutos)
- [ ] Usar node-cron ou agenda
- [ ] Auto-resolver alerta quando sensor volta
- [ ] Testes

---

## Migrations (ordem)

4. `004_create_alerts_table.sql`
5. `005_create_rules_table.sql`
6. `006_create_alert_cooldowns_table.sql`
7. `007_create_notifications_log_table.sql`

---

## Filas RabbitMQ

| Fila | Producer | Consumer | Descrição |
|------|----------|----------|-----------|
| `readings.process` | Ingest | Reading Consumer | Processar leituras |
| `alerts.created` | Rules Engine | (futuro) | Evento de alerta criado |
| `notifications.send` | Alert Service | Notification Consumer | Enviar notificação |

---

## Testes

### Unitários

- [ ] rules-engine.service.spec.ts
- [ ] alert.service.spec.ts
- [ ] rule.service.spec.ts
- [ ] notification.service.spec.ts

### Integração

- [ ] Leitura fora do range → alerta criado
- [ ] Bateria CRITICAL → alerta + email
- [ ] Cooldown respeitado (não duplica alerta)
- [ ] Sensor offline → alerta após 30min

### Cenários de Teste

```typescript
describe('RulesEngine', () => {
  it('should create alert when temperature above threshold', async () => {
    // Regra: temperatura máxima 25°C
    // Reading: 28°C
    // Resultado: Alert TEMPERATURE_HIGH
  });

  it('should not create alert when within range', async () => {
    // Regra: temperatura entre 2-8°C
    // Reading: 5°C
    // Resultado: nenhum alerta
  });

  it('should respect cooldown period', async () => {
    // Alerta criado há 5 minutos
    // Cooldown: 30 minutos
    // Nova violação
    // Resultado: não cria novo alerta
  });

  it('should create battery critical alert', async () => {
    // Reading: battery_level = CRITICAL
    // Resultado: Alert BATTERY_CRITICAL, severity CRITICAL
  });
});
```

---

## Critérios de Conclusão

A Fase 2 está completa quando:

1. [ ] CRUD de Rules funciona via API
2. [ ] CRUD de Alerts funciona via API
3. [ ] Rules Engine avalia leituras corretamente
4. [ ] Alertas são criados quando regras são violadas
5. [ ] Cooldown funciona (evita spam de alertas)
6. [ ] E-mails são enviados para alertas críticos
7. [ ] Job de sensor offline funciona
8. [ ] Testes passando (>80% coverage)

---

## Dependências Adicionais

```json
{
  "dependencies": {
    "nodemailer": "^6.x",
    "node-cron": "^3.x",
    "handlebars": "^4.x"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.x",
    "@types/node-cron": "^3.x"
  }
}
```

---

## Variáveis de Ambiente

```env
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
SMTP_FROM=noreply@seusistema.com

# Alertas
ALERT_COOLDOWN_DEFAULT=30
SENSOR_OFFLINE_THRESHOLD=30
```

---

## Próxima Fase

Após completar a Fase 2, seguir para [Fase 3 — Autenticação e Multi-tenant](fase-3-auth-multitenant.md).
