# REGRAS E ESCOPO DO PROJETO — PLATAFORMA IoT DE CADEIA FRIA

## VISÃO GERAL

Sistema de monitoramento contínuo de **temperatura e umidade** para ambientes regulados (laboratórios, clínicas, alimentos), focado em **compliance operacional automatizado**.

---

## ESCALA DO SISTEMA

### Números de Referência (Ordem de Grandeza)

| Métrica | Valor |
|---------|-------|
| Sensores ativos | 30.000 |
| Clientes simultâneos | 400 |
| Alarmes/ano | 240.000 |
| Registros de manutenção | 6.500 |
| Eventos de porta aberta | 6.000 |

### Requisitos Não-Funcionais

- Dados em tempo real
- Alta disponibilidade
- Zero perda de histórico

### O Que Isso Elimina

- ❌ Arquitetura monolítica tradicional (sem modularização)
- ❌ Banco relacional único sem time-series
- ❌ Polling ingênuo
- ❌ Processamento síncrono

---

## PRODUTO ENTREGUE AO CLIENTE

- Sensores físicos instalados nos ativos
- Monitoramento contínuo 24/7
- Alertas automáticos (SMS, e-mail, push)
- Relatórios digitais
- Histórico imutável para auditoria
- Certificados de calibração
- Plataforma web multi-tenant

---

## HARDWARE — MVP SENSOR WI-FI

### Componentes Principais

| Componente | Especificação |
|------------|---------------|
| Microcontrolador | ESP32-C3 (Wi-Fi nativo, low power) |
| Sensor | SHT35 (Sensirion) — ±0,2 °C |
| Bateria | Li-SOCl₂ ER14505 (AA, 3,6 V) |
| Regulador | LDO ultra low power (3,3 V) |
| Memória | Flash SPI externa (data logger) |
| Antena | Wi-Fi 2.4 GHz externa |
| Interface | LED de status + botão |
| Proteção | Caixa IP67 |

### Características Técnicas

- Deep sleep agressivo
- Envio em batch (não contínuo)
- Operação offline com sincronização posterior
- **Autonomia estimada: 6–12 meses**
- Data logger embarcado obrigatório (nunca perder dados)

---

## CONECTIVIDADE

### MVP (Fase 1)

- Wi-Fi direto no sensor
- Sem 3G/4G (alto consumo de bateria)

### Fase 2

- Gateway celular opcional para locais sem Wi-Fi

---

## CALIBRAÇÃO E CERTIFICAÇÃO

### Fase MVP

- Calibração interna controlada
- Equipamento de referência calibrado
- Correção por software (offset)
- Certificado simples emitido pelo sistema

### Fase Escala

- Calibração em laboratório acreditado (RBC/Inmetro)
- Renovação anual obrigatória
- Alertas automáticos de vencimento
- **Calibração como fonte de receita recorrente**

---

## ARQUITETURA DE SOFTWARE

### Abordagem: Monolito Modular

**Por que Monolito Modular?**

- Simplicidade operacional (1 deploy, 1 processo)
- Mais fácil de debugar e testar
- Sem overhead de rede entre serviços
- Pode ser extraído para microserviços se necessário
- Ideal para equipe pequena e MVP

**A modularização interna permite escalar depois sem reescrever.**

### Hospedagem

**Railway** (PaaS) — simplifica operação

### Estrutura de Módulos

```
src/
├── modules/
│   ├── sensor/           # Domínio: sensores e leituras
│   │   ├── sensor.entity.ts
│   │   ├── sensor.repository.ts
│   │   ├── sensor.service.ts
│   │   ├── sensor.controller.ts
│   │   └── sensor.module.ts
│   │
│   ├── reading/          # Domínio: leituras de temperatura/umidade
│   │   ├── reading.entity.ts
│   │   ├── reading.repository.ts
│   │   ├── reading.service.ts
│   │   └── reading.module.ts
│   │
│   ├── alert/            # Domínio: regras e alertas
│   │   ├── alert.entity.ts
│   │   ├── alert.service.ts
│   │   ├── rules-engine.service.ts
│   │   └── alert.module.ts
│   │
│   ├── tenant/           # Domínio: clientes/organizações
│   │   ├── tenant.entity.ts
│   │   ├── tenant.repository.ts
│   │   ├── tenant.service.ts
│   │   └── tenant.module.ts
│   │
│   ├── platform/         # Domínio: gestão do SaaS
│   │   ├── platform-user.entity.ts
│   │   ├── platform-user.service.ts
│   │   ├── platform-auth.service.ts
│   │   └── platform.module.ts
│   │
│   ├── user/             # Domínio: usuários do tenant
│   │   ├── user.entity.ts
│   │   ├── user.service.ts
│   │   ├── auth.service.ts
│   │   └── user.module.ts
│   │
│   ├── notification/     # Domínio: envio de notificações
│   │   ├── notification.service.ts
│   │   ├── email.provider.ts
│   │   ├── sms.provider.ts
│   │   └── notification.module.ts
│   │
│   └── ingest/           # Domínio: recebimento de dados
│       ├── ingest.controller.ts
│       ├── ingest.service.ts
│       ├── ingest.validator.ts
│       └── ingest.module.ts
│
├── shared/               # Código compartilhado
│   ├── database/
│   ├── queue/
│   ├── utils/
│   └── interfaces/
│
├── config/               # Configurações
└── app.ts                # Bootstrap
```

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                        SENSORES                             │
│                     (ESP32-C3 + SHT35)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS POST /ingest
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   MONOLITO MODULAR                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ INGEST MODULE                                          │ │
│  │ - Recebe payload do sensor                             │ │
│  │ - Valida estrutura                                     │ │
│  │ - Adiciona timestamp (received_at)                     │ │
│  │ - Enfileira para processamento                         │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ QUEUE (RabbitMQ)                                       │ │
│  │ - Desacopla recebimento de processamento               │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ READING MODULE (Worker)                                │ │
│  │ - Persiste leitura no banco                            │ │
│  │ - Identifica tenant pelo serial_number                 │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ALERT MODULE (Rules Engine)                            │ │
│  │ - Avalia regras (temperatura fora do range, etc)       │ │
│  │ - Cria alertas se necessário                           │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ NOTIFICATION MODULE                                    │ │
│  │ - Dispara e-mail/SMS se houver alerta                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│   PostgreSQL +   │    │  Object Storage  │
│   TimescaleDB    │    │   (S3-like)      │
│                  │    │                  │
│ Dados de negócio │    │ Dados brutos     │
│ + time-series    │    │ imutáveis        │
└──────────────────┘    └──────────────────┘
```

### Princípios Arquiteturais

- **Monolito Modular**: separação lógica, deploy único
- **SOLID**: cada módulo tem responsabilidade única
- **Event-driven**: tudo é evento
- **Processamento assíncrono**: fila desacopla ingestão de processamento
- **Multi-tenant**: isolamento por `tenant_id`
- **Escalável horizontalmente**: stateless onde possível
- **Zero perda de dados**: object storage imutável para auditoria

---

## DADOS DOS SENSORES

### Payload Recebido (MVP)

```json
{
  "serial_number": "JV005SMHO000000",
  "temperature": 22.8,
  "humidity": 64.5,
  "battery_level": "LOW"
}
```

### Campos Adicionados pelo Sistema

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `received_at` | timestamp | Momento exato do recebimento no servidor (UTC) |
| `tenant_id` | uuid | Identificado automaticamente pelo `serial_number` |
| `reading_id` | uuid | ID único da leitura |

### Estrutura Completa Persistida

```json
{
  "reading_id": "uuid-v4",
  "serial_number": "JV005SMHO000000",
  "tenant_id": "uuid-do-cliente",
  "temperature": 22.8,
  "humidity": 64.5,
  "battery_level": "LOW",
  "received_at": "2024-01-15T14:32:00.000Z"
}
```

### Regras de Negócio

1. **Um sensor pertence a um único tenant**
   - `serial_number` → `tenant_id` (relação 1:1)
   - Lookup feito na tabela `sensors`

2. **Timestamp obrigatório**
   - Sempre gerado no servidor (não confiar no sensor)
   - Formato ISO 8601, timezone UTC

3. **Dados imutáveis**
   - Leituras nunca são editadas ou deletadas
   - Histórico completo para auditoria

4. **Extensibilidade**
   - Payload pode crescer (novos campos no futuro)
   - Campos desconhecidos são armazenados em `metadata` (JSONB)

### Valores de `battery_level`

| Valor | Significado |
|-------|-------------|
| `HIGH` | Bateria > 70% |
| `MEDIUM` | Bateria 30-70% |
| `LOW` | Bateria < 30% |
| `CRITICAL` | Bateria < 10% (gera alerta) |

---

## CONTROLE DE ACESSO (2 NÍVEIS)

### Estrutura

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

### Roles da Plataforma (Gestão SaaS)

| Role | Descrição | Permissões Principais |
|------|-----------|----------------------|
| `SUPER_ADMIN` | Dono/CTO | Acesso total, criar tenants, configurações |
| `SUPPORT` | Suporte técnico | Ver tenants, impersonar usuários, logs |
| `FINANCE` | Financeiro | Billing, planos, métricas financeiras |

### Roles do Tenant (Clientes)

| Role | Descrição | Permissões Principais |
|------|-----------|----------------------|
| `ADMIN` | Admin do cliente | Acesso total ao tenant, gerenciar usuários |
| `OPERATOR` | Operador | Gerenciar sensores, alertas, regras |
| `VIEWER` | Visualizador | Apenas leitura de dados |

---

## PRINCÍPIOS SOLID APLICADOS

### S — Single Responsibility

Cada módulo tem uma única razão para mudar:

| Módulo | Responsabilidade |
|--------|------------------|
| `ingest` | Receber e validar dados |
| `reading` | Persistir leituras |
| `alert` | Avaliar regras e criar alertas |
| `notification` | Enviar notificações |
| `tenant` | Gerenciar clientes |
| `sensor` | Gerenciar sensores |

### O — Open/Closed

- **Rules Engine extensível**: adicionar novas regras sem modificar código existente
- **Notification providers**: adicionar novos canais (WhatsApp, Telegram) sem alterar o módulo
- Uso de interfaces e injeção de dependência

### L — Liskov Substitution

- Todos os providers de notificação implementam `INotificationProvider`
- Todos os repositories implementam interface base `IRepository<T>`

### I — Interface Segregation

- Interfaces pequenas e específicas
- `ISensorRepository` não força métodos de `ITenantRepository`

### D — Dependency Inversion

- Módulos dependem de abstrações (interfaces), não de implementações
- Database, Queue, Storage são injetados via interface
- Facilita testes e troca de implementações

```typescript
// Exemplo: Service depende de interface, não de implementação
class ReadingService {
  constructor(
    private readonly readingRepository: IReadingRepository,
    private readonly queue: IQueue,
    private readonly logger: ILogger
  ) {}
}
```

---

## CAPACIDADE — FASE 1

| Métrica | Valor |
|---------|-------|
| Sensores | 1.000 |
| Clientes | 250 |
| Requests/dia | ~12.000 |
| Alertas/ano | dezenas de milhares |
| Limite sem refatoração | ~5.000 sensores |

---

## CUSTOS DE INFRAESTRUTURA

### Railway (estimativa mensal)

| Serviço | Custo |
|---------|-------|
| Infra total | ~R$ 265/mês |

> **Cloud não é gargalo financeiro. Pessoas são o principal OPEX.**

---

## MODELO DE NEGÓCIO

### Pricing Mensal

| Plano | Preço | Mix |
|-------|-------|-----|
| Básico | R$ 247 | 60% |
| Negócios | R$ 397 | 30% |
| Enterprise | R$ 997 | 10% |
| Setup (único) | R$ 497 | — |

### Indicadores Financeiros (250 clientes)

| Indicador | Valor |
|-----------|-------|
| MRR | R$ 91.750 |
| Receita 24 meses | R$ 2,33M |
| Margem operacional | ~83% |
| Payback hardware | ~2 meses |
| LTV médio | ~R$ 9.300 |

---

## MODELO DE CANAIS

### Afiliado Indicador

- Apenas indica clientes
- 10–15% da mensalidade por 12 meses
- 20–30% do setup
- Zero risco técnico

### Afiliado Implantador Certificado

- Indica + instala
- Comissão maior **ou** parceiro fica com setup
- Você mantém MRR
- Treinamento e SLA obrigatórios

---

## DIFERENCIAIS ESTRUTURAIS

1. **Histórico imutável** — lock-in natural
2. **Calibração integrada** ao software
3. **Alertas e compliance** como produto
4. **CAC baixo** via canais
5. **Cloud irrelevante** no custo
6. **Alto LTV** e previsibilidade

---

## ROADMAP DE DESENVOLVIMENTO

### Ordem de Prioridade

> **Backend primeiro, Frontend e Sensores por último.**
>
> Motivo: validar regras de negócio e fluxo de dados antes de investir em UI e hardware.

---

### Fase 1 — Core Backend (ATUAL)

**Objetivo**: Sistema funcional recebendo dados simulados

Ver detalhes em: [docs/fase-1-core-backend.md](docs/fase-1-core-backend.md)

### Fase 2 — Regras e Alertas

**Objetivo**: Sistema reagindo a eventos

Ver detalhes em: [docs/fase-2-regras-alertas.md](docs/fase-2-regras-alertas.md)

### Fase 3 — Autenticação e Multi-tenant

**Objetivo**: Sistema pronto para múltiplos clientes

Ver detalhes em: [docs/fase-3-auth-multitenant.md](docs/fase-3-auth-multitenant.md)

### Fase 4 — Produção

**Objetivo**: Sistema em produção com clientes piloto

Ver detalhes em: [docs/fase-4-producao.md](docs/fase-4-producao.md)

### Fase 5 — Frontend Web

**Objetivo**: Interface para clientes

Ver detalhes em: [docs/fase-5-frontend.md](docs/fase-5-frontend.md)

### Fase 6 — Hardware/Firmware

**Objetivo**: Sensores físicos funcionando

Ver detalhes em: [docs/fase-6-hardware.md](docs/fase-6-hardware.md)

---

### Entregas por Fase

| Fase | Entrega Principal | Depende de |
|------|-------------------|------------|
| 1 | Backend recebendo dados | — |
| 2 | Alertas funcionando | Fase 1 |
| 3 | Multi-tenant + Auth | Fase 2 |
| 4 | Produção (clientes piloto) | Fase 3 |
| 5 | Dashboard web | Fase 4 |
| 6 | Sensores físicos | Fase 4 |

---

## DEFINIÇÃO DO SISTEMA

> **Não é um projeto de IoT.**
> É uma **plataforma de eventos regulatórios com sensores como fonte de dados**.

### Filosofia Técnica

- **Simples** onde precisa ser
- **Robusta** onde não pode falhar
- **Escalável** sem dívida técnica

### Filosofia de Negócio

- Margem alta
- Payback rápido
- Modelo defensável
- **Meta: R$ 1M/mês** sem apostas tecnológicas arriscadas

---

## STACK TECNOLÓGICO (DECISÕES)

### Backend

- **Node.js** com TypeScript
- **Express** para APIs
- **RabbitMQ** para filas (amqplib)
- **PostgreSQL** + **TimescaleDB** para dados

### Frontend

- **React** 
- **TailwindCSS** para UI
- **Recharts** ou **Chart.js** para gráficos

### Infraestrutura

- **Railway** (PaaS principal)
- **RabbitMQ** (filas)
- **S3-compatible** storage (backup imutável)

### Firmware

- **ESP-IDF** ou **Arduino** para ESP32-C3
- **HTTPS** para comunicação segura
- **JSON** para payload

---

## REGRAS DE DESENVOLVIMENTO

### Princípios Gerais

1. **Event-driven first**: todo dado entra como evento
2. **Never lose data**: sempre persistir antes de processar
3. **Tenant isolation**: `tenant_id` em toda query
4. **Idempotency**: sensores podem reenviar sem duplicar
5. **Offline-first**: sensor funciona sem internet
6. **Audit trail**: tudo tem timestamp e origem
7. **Simple beats clever**: código legível > código "esperto"

### Arquitetura

8. **Monolito Modular**: módulos isolados, deploy único
9. **SOLID sempre**: cada classe/módulo tem uma responsabilidade
10. **Injeção de dependência**: facilita testes e manutenção
11. **Interfaces primeiro**: definir contratos antes de implementar

### Dados

12. **Timestamp no servidor**: nunca confiar no timestamp do sensor
13. **UUID para IDs**: evita colisões, permite merge de dados
14. **JSONB para extensibilidade**: campos extras vão em `metadata`
15. **Imutabilidade**: leituras nunca são alteradas ou deletadas

### Ordem de Desenvolvimento

16. **Backend primeiro**: validar regras antes de fazer UI
17. **Testes com mock**: simular sensores antes de ter hardware
18. **Frontend por último**: só após backend estável
19. **Hardware por último**: firmware só quando API estiver pronta

---

*Documento vivo — atualizar conforme decisões forem tomadas.*
