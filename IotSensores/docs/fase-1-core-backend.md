# FASE 1 — CORE BACKEND

## Objetivo

Criar a base do sistema backend capaz de:
- Receber dados de sensores (simulados)
- Persistir leituras no banco de dados
- Processar dados de forma assíncrona via fila

**Ao final desta fase**: o sistema aceita POST de dados simulados e persiste no banco.

---

## Entregas

### 1. Setup do Projeto

- [ ] Inicializar projeto Node.js com TypeScript
- [ ] Configurar ESLint + Prettier
- [ ] Configurar estrutura de pastas (monolito modular)
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Criar scripts npm (dev, build, start, test)
- [ ] Configurar Docker Compose (PostgreSQL + Redis)

**Estrutura de pastas:**

```
src/
├── modules/
│   ├── tenant/
│   ├── sensor/
│   ├── reading/
│   └── ingest/
├── shared/
│   ├── database/
│   ├── queue/
│   ├── errors/
│   └── interfaces/
├── config/
│   └── index.ts
└── app.ts
```

---

### 2. Módulo Shared (Infraestrutura)

#### 2.1 Database

- [ ] Configurar conexão PostgreSQL (pg ou Knex)
- [ ] Criar migration runner
- [ ] Configurar pool de conexões
- [ ] Interface `IDatabase`

#### 2.2 Queue

- [ ] Configurar RabbitMQ (amqplib)
- [ ] Criar abstração `IQueue`
- [ ] Criar consumer base
- [ ] Health check da fila

#### 2.3 Interfaces Base

```typescript
// src/shared/interfaces/repository.interface.ts
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filters?: object): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
```

---

### 3. Módulo Tenant

**Responsabilidade**: Gerenciar clientes/organizações

#### Entidade

```typescript
interface Tenant {
  id: string;           // UUID
  name: string;         // Nome da empresa
  document: string;     // CNPJ
  email: string;        // Email principal
  is_active: boolean;   // Status
  created_at: Date;
  updated_at: Date;
}
```

#### Tarefas

- [ ] Criar migration `create_tenants_table`
- [ ] Criar `tenant.entity.ts`
- [ ] Criar `tenant.repository.ts` (implements IRepository)
- [ ] Criar `tenant.service.ts`
- [ ] Criar `tenant.controller.ts` (CRUD REST)
- [ ] Testes unitários do service

#### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/tenants | Criar tenant |
| GET | /api/tenants | Listar tenants |
| GET | /api/tenants/:id | Buscar por ID |
| PUT | /api/tenants/:id | Atualizar |
| DELETE | /api/tenants/:id | Desativar (soft delete) |

---

### 4. Módulo Sensor

**Responsabilidade**: Gerenciar sensores e vinculação com tenant

#### Entidade

```typescript
interface Sensor {
  id: string;              // UUID
  serial_number: string;   // Único, ex: "JV005SMHO000000"
  tenant_id: string;       // FK para tenant
  name: string;            // Nome amigável (ex: "Geladeira Lab 1")
  location: string;        // Localização física
  is_active: boolean;
  last_reading_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
```

#### Tarefas

- [ ] Criar migration `create_sensors_table`
- [ ] Criar índice único em `serial_number`
- [ ] Criar `sensor.entity.ts`
- [ ] Criar `sensor.repository.ts`
- [ ] Criar `sensor.service.ts`
- [ ] Criar `sensor.controller.ts`
- [ ] Método `findBySerialNumber(serial: string)`
- [ ] Testes unitários

#### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/sensors | Criar sensor |
| GET | /api/sensors | Listar sensores |
| GET | /api/sensors/:id | Buscar por ID |
| GET | /api/sensors/serial/:serial | Buscar por serial |
| PUT | /api/sensors/:id | Atualizar |
| DELETE | /api/sensors/:id | Desativar |

---

### 5. Módulo Reading

**Responsabilidade**: Persistir e consultar leituras de temperatura/umidade

#### Entidade

```typescript
interface Reading {
  id: string;              // UUID
  sensor_id: string;       // FK para sensor
  tenant_id: string;       // FK para tenant (desnormalizado para performance)
  serial_number: string;   // Desnormalizado para queries
  temperature: number;     // Celsius
  humidity: number;        // Percentual
  battery_level: string;   // HIGH, MEDIUM, LOW, CRITICAL
  received_at: Date;       // Timestamp UTC do servidor
  metadata: object;        // JSONB para campos extras
}
```

#### Tarefas

- [ ] Criar migration `create_readings_table`
- [ ] Configurar TimescaleDB hypertable (se disponível)
- [ ] Criar índices: `(tenant_id, received_at)`, `(sensor_id, received_at)`
- [ ] Criar `reading.entity.ts`
- [ ] Criar `reading.repository.ts`
- [ ] Criar `reading.service.ts`
- [ ] Método `createFromIngest(data)` — adiciona timestamp
- [ ] Método `findBySensor(sensorId, dateRange)`
- [ ] Método `findByTenant(tenantId, dateRange)`
- [ ] Testes unitários

#### Endpoints (somente leitura)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/readings | Listar leituras (com filtros) |
| GET | /api/readings/sensor/:id | Leituras de um sensor |
| GET | /api/readings/latest/:sensorId | Última leitura |

---

### 6. Módulo Ingest

**Responsabilidade**: Receber dados dos sensores, validar e enfileirar

#### Fluxo

```
POST /ingest
    │
    ▼
┌─────────────────┐
│ Validar payload │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Adicionar       │
│ received_at     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Enfileirar      │
│ (BullMQ)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retornar 202    │
│ Accepted        │
└─────────────────┘
```

#### Payload Esperado

```json
{
  "serial_number": "JV005SMHO000000",
  "temperature": 22.8,
  "humidity": 64.5,
  "battery_level": "LOW"
}
```

#### Validações

- [ ] `serial_number`: string, obrigatório, formato válido
- [ ] `temperature`: number, obrigatório, range -50 a 100
- [ ] `humidity`: number, obrigatório, range 0 a 100
- [ ] `battery_level`: enum [HIGH, MEDIUM, LOW, CRITICAL]

#### Tarefas

- [ ] Criar `ingest.validator.ts` (usando Zod ou Joi)
- [ ] Criar `ingest.service.ts`
- [ ] Criar `ingest.controller.ts`
- [ ] Endpoint POST `/ingest` (público, sem auth por enquanto)
- [ ] Resposta 202 Accepted com `{ received: true, timestamp }`
- [ ] Tratamento de erro para sensor não cadastrado
- [ ] Testes de integração

#### Worker de Processamento

- [ ] Criar `reading.consumer.ts`
- [ ] Consumir fila `readings.process`
- [ ] Lookup sensor pelo `serial_number`
- [ ] Persistir reading no banco
- [ ] Atualizar `last_reading_at` do sensor
- [ ] Log de processamento

---

### 7. Script Mock Sensor

**Objetivo**: Simular envio de dados para testar o sistema

```typescript
// scripts/mock-sensor.ts
// Envia dados fake para POST /ingest a cada X segundos
```

#### Tarefas

- [ ] Criar script que envia dados aleatórios
- [ ] Configurável: intervalo, serial_number, ranges
- [ ] Modo batch (envia vários de uma vez)
- [ ] Log de envios

---

### 8. Health Check e Observabilidade

- [ ] Endpoint GET `/health` (status do app)
- [ ] Endpoint GET `/health/db` (status do banco)
- [ ] Endpoint GET `/health/queue` (status do RabbitMQ)
- [ ] Logging estruturado (pino ou winston)

---

## Migrations (ordem)

1. `001_create_tenants_table.sql`
2. `002_create_sensors_table.sql`
3. `003_create_readings_table.sql`

---

## Testes

### Unitários

- [ ] tenant.service.spec.ts
- [ ] sensor.service.spec.ts
- [ ] reading.service.spec.ts
- [ ] ingest.validator.spec.ts

### Integração

- [ ] POST /ingest → fila → banco
- [ ] Fluxo completo com mock sensor

---

## Critérios de Conclusão

A Fase 1 está completa quando:

1. [ ] `docker-compose up` sobe PostgreSQL + Redis
2. [ ] `npm run dev` inicia o servidor
3. [ ] CRUD de tenants funciona via API
4. [ ] CRUD de sensors funciona via API
5. [ ] POST /ingest aceita payload e retorna 202
6. [ ] Worker processa fila e persiste no banco
7. [ ] GET /readings retorna dados persistidos
8. [ ] Mock sensor envia dados com sucesso
9. [ ] Testes passando (>80% coverage nos services)

---

## Dependências NPM

```json
{
  "dependencies": {
    "express": "^4.18.x",
    "pg": "^8.x",
    "amqplib": "^0.10.x",
    "zod": "^3.x",
    "uuid": "^9.x",
    "pino": "^8.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsx": "^4.x",
    "@types/express": "^4.x",
    "@types/node": "^20.x",
    "@types/pg": "^8.x",
    "@types/amqplib": "^0.10.x",
    "@types/uuid": "^9.x",
    "vitest": "^1.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

---

## Ambiente Local

### docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: iot
      POSTGRES_PASSWORD: iot123
      POSTGRES_DB: iot_sensores
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: iot
      RABBITMQ_DEFAULT_PASS: iot123
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  postgres_data:
  rabbitmq_data:
```

### .env.example

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://iot:iot123@localhost:5432/iot_sensores

# RabbitMQ
RABBITMQ_URL=amqp://iot:iot123@localhost:5672

# Logging
LOG_LEVEL=debug
```

---

## Próxima Fase

Após completar a Fase 1, seguir para [Fase 2 — Regras e Alertas](fase-2-regras-alertas.md).
