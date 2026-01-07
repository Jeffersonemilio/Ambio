# FASE 5 — FRONTEND WEB

## Objetivo

Criar interface web para clientes e administradores:
- Dashboard do cliente (tenant)
- Painel administrativo do SaaS
- Visualização de dados em tempo real
- Gestão de alertas e configurações

**Ao final desta fase**: clientes conseguem usar o sistema via interface web.

---

## Pré-requisitos

- Fase 4 completa (sistema em produção)
- API documentada (Swagger)
- Clientes piloto usando a API
- Feedback inicial coletado

---

## Estrutura do Frontend

### Duas Aplicações Separadas

```
frontend/
├── client/          # App do cliente (tenant)
│   └── ...
└── admin/           # App administrativo (SaaS)
    └── ...
```

**Por que separar?**
- Bundles menores
- Deploy independente
- Domínios diferentes (app.dominio.com vs admin.dominio.com)
- Permissões completamente diferentes

---

## PARTE 1: APP DO CLIENTE

### 1.1 Stack Tecnológico

| Tecnologia | Uso |
|------------|-----|
| React 18 | Framework |
| TypeScript | Tipagem |
| Vite | Build tool |
| TailwindCSS | Estilos |
| React Query | Data fetching |
| React Router | Navegação |
| Recharts | Gráficos |
| React Hook Form | Formulários |
| Zod | Validação |
| Zustand | Estado global (leve) |

### 1.2 Estrutura de Pastas

```
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/              # Componentes base (Button, Input, Card...)
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── charts/          # Gráficos reutilizáveis
│   │   └── forms/           # Formulários reutilizáveis
│   │
│   ├── features/            # Módulos por feature
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── pages/
│   │   ├── dashboard/
│   │   ├── sensors/
│   │   ├── readings/
│   │   ├── alerts/
│   │   ├── rules/
│   │   ├── users/
│   │   └── settings/
│   │
│   ├── hooks/               # Hooks globais
│   ├── services/            # API client
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript types
│   ├── utils/               # Helpers
│   ├── App.tsx
│   └── main.tsx
│
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 1.3 Páginas do Cliente

| Página | Rota | Descrição |
|--------|------|-----------|
| Login | `/login` | Autenticação |
| Dashboard | `/` | Visão geral |
| Sensores | `/sensors` | Lista de sensores |
| Sensor Detail | `/sensors/:id` | Detalhes + histórico |
| Alertas | `/alerts` | Lista de alertas |
| Regras | `/rules` | Configurar regras |
| Usuários | `/users` | Gerenciar usuários |
| Configurações | `/settings` | Config do tenant |
| API Keys | `/settings/api-keys` | Gerenciar API keys |
| Perfil | `/profile` | Dados do usuário |

### 1.4 Telas Principais

#### Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  IoT Sensores          [Alertas 🔔 3]  [Perfil 👤]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ Sensores│ │ Alertas │ │ Leituras│ │ Uptime  │            │
│ │   24    │ │  3 🔴   │ │  1.2k   │ │  99.9%  │            │
│ │ ativos  │ │ abertos │ │  /hora  │ │         │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              Temperatura (últimas 24h)                  │ │
│ │  📈 [Gráfico de linha com todos os sensores]           │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ Alertas Recentes     │ │ Sensores com Problema│          │
│ │ • Temp alta - Sala 1 │ │ • Geladeira 2 - 🔴   │          │
│ │ • Bateria baixa - S3 │ │ • Freezer 1 - 🟡     │          │
│ │ • Offline - Sensor 5 │ │                      │          │
│ └──────────────────────┘ └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

#### Lista de Sensores

```
┌─────────────────────────────────────────────────────────────┐
│ Sensores                              [+ Adicionar Sensor]  │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Buscar...                    Filtrar: [Todos ▼]         │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 Geladeira Lab 1         23.5°C  65%  🔋 HIGH        │ │
│ │    JV005SMHO000001         Última: há 2 min            │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🟢 Freezer Principal       -18.2°C  45%  🔋 MEDIUM     │ │
│ │    JV005SMHO000002         Última: há 1 min            │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🔴 Sala de Vacinas         28.1°C  70%  🔋 LOW         │ │
│ │    JV005SMHO000003         ⚠️ ALERTA: Temperatura alta │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ⚫ Câmara Fria 2           --      --   🔋 --          │ │
│ │    JV005SMHO000004         ⚠️ OFFLINE há 30 min        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Mostrando 4 de 24 sensores            [< 1 2 3 ... 6 >]    │
└─────────────────────────────────────────────────────────────┘
```

#### Detalhe do Sensor

```
┌─────────────────────────────────────────────────────────────┐
│ ← Voltar    Geladeira Lab 1                    [Editar]    │
├─────────────────────────────────────────────────────────────┤
│ Serial: JV005SMHO000001    Status: 🟢 Online               │
│ Localização: Laboratório 1, Prédio A                       │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ Temperatura  │ │ Umidade      │ │ Bateria      │         │
│ │    23.5°C    │ │    65%       │ │    HIGH      │         │
│ │   (2-8°C ok) │ │  (40-70% ok) │ │    >70%      │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                             │
│ [Hoje] [7 dias] [30 dias] [Customizado]                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              📈 Histórico de Temperatura                │ │
│ │  [Gráfico de linha com min/max/média]                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Alertas deste sensor                                    │ │
│ │ • 15/01 14:30 - Temperatura acima de 8°C (RESOLVIDO)   │ │
│ │ • 10/01 08:15 - Bateria baixa (RESOLVIDO)              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Lista de Alertas

```
┌─────────────────────────────────────────────────────────────┐
│ Alertas                                                     │
├─────────────────────────────────────────────────────────────┤
│ [Abertos (3)] [Reconhecidos (5)] [Resolvidos] [Todos]      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 CRITICAL  Temperatura acima do limite                │ │
│ │    Sensor: Geladeira Lab 1   Valor: 28.1°C (máx: 8°C)  │ │
│ │    Há 15 minutos                    [Reconhecer]        │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🟡 WARNING   Bateria baixa                              │ │
│ │    Sensor: Freezer 3         Nível: LOW (<30%)         │ │
│ │    Há 2 horas                       [Reconhecer]        │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🟡 WARNING   Sensor offline                             │ │
│ │    Sensor: Câmara Fria 2     Última leitura: 30 min    │ │
│ │    Há 30 minutos                    [Reconhecer]        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.5 Componentes Reutilizáveis

#### UI Base (TailwindCSS)

```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// src/components/ui/Card.tsx
// src/components/ui/Input.tsx
// src/components/ui/Select.tsx
// src/components/ui/Modal.tsx
// src/components/ui/Table.tsx
// src/components/ui/Badge.tsx
// src/components/ui/Alert.tsx
// src/components/ui/Spinner.tsx
```

#### Componentes de Negócio

```typescript
// src/components/SensorCard.tsx
// src/components/AlertBadge.tsx
// src/components/TemperatureChart.tsx
// src/components/HumidityChart.tsx
// src/components/BatteryIndicator.tsx
// src/components/SensorStatusIndicator.tsx
// src/components/ReadingValue.tsx
```

### 1.6 Tarefas - App Cliente

#### Setup

- [ ] Criar projeto Vite + React + TypeScript
- [ ] Configurar TailwindCSS
- [ ] Configurar React Router
- [ ] Configurar React Query
- [ ] Criar API client (axios/fetch)
- [ ] Configurar Zustand para auth state

#### Componentes UI

- [ ] Button, Input, Select, Checkbox
- [ ] Card, Modal, Drawer
- [ ] Table com paginação
- [ ] Badge, Alert, Toast
- [ ] Spinner, Skeleton
- [ ] DatePicker, DateRangePicker

#### Features

- [ ] Auth (login, logout, refresh)
- [ ] Dashboard principal
- [ ] Lista de sensores
- [ ] Detalhe do sensor + gráficos
- [ ] Lista de alertas
- [ ] Ação de acknowledge/resolve
- [ ] Configuração de regras
- [ ] Gestão de usuários (ADMIN)
- [ ] Configurações do tenant
- [ ] Perfil do usuário

#### Gráficos

- [ ] Gráfico de temperatura (linha)
- [ ] Gráfico de umidade (linha)
- [ ] Gráfico de alertas (barras)
- [ ] Mini sparklines para cards

---

## PARTE 2: APP ADMINISTRATIVO (SaaS)

### 2.1 Páginas do Admin

| Página | Rota | Role |
|--------|------|------|
| Login | `/login` | - |
| Dashboard | `/` | ANY |
| Tenants | `/tenants` | ANY |
| Tenant Detail | `/tenants/:id` | ANY |
| Platform Users | `/users` | SUPER_ADMIN |
| Billing | `/billing` | SUPER_ADMIN, FINANCE |
| System Metrics | `/metrics` | ANY |
| Logs | `/logs` | SUPER_ADMIN, SUPPORT |
| Settings | `/settings` | SUPER_ADMIN |

### 2.2 Telas do Admin

#### Dashboard Admin

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Admin Panel                          [Perfil 👤]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ Tenants │ │ Sensores│ │ Leituras│ │   MRR   │            │
│ │   45    │ │   892   │ │  12.5k  │ │ R$41.2k │            │
│ │ ativos  │ │  total  │ │  /hora  │ │         │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              Crescimento de Tenants (12 meses)          │ │
│ │  📈 [Gráfico de barras]                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ Últimos Tenants      │ │ Alertas do Sistema   │          │
│ │ • Empresa ABC - hoje │ │ • API latency high   │          │
│ │ • Lab XYZ - ontem    │ │ • Queue backlog      │          │
│ └──────────────────────┘ └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

#### Lista de Tenants

```
┌─────────────────────────────────────────────────────────────┐
│ Tenants                                  [+ Novo Tenant]    │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Buscar...           Status: [Todos ▼]  Plano: [Todos ▼] │
├─────────────────────────────────────────────────────────────┤
│ │ Empresa       │ Plano    │ Sensores │ Status │ Ações    │ │
│ ├───────────────┼──────────┼──────────┼────────┼──────────┤ │
│ │ Lab ABC       │ Business │ 24       │ 🟢     │ [•••]    │ │
│ │ Clínica XYZ   │ Basic    │ 8        │ 🟢     │ [•••]    │ │
│ │ Hospital 123  │ Enterprise│ 156     │ 🟢     │ [•••]    │ │
│ │ Farmácia Test │ Basic    │ 3        │ 🔴     │ [•••]    │ │
│ └───────────────┴──────────┴──────────┴────────┴──────────┘ │
│                                                             │
│ [•••] = Impersonate | Editar | Suspender                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Tarefas - App Admin

- [ ] Setup projeto (mesmo stack)
- [ ] Login admin separado
- [ ] Dashboard com métricas globais
- [ ] CRUD de tenants
- [ ] Ação de impersonate
- [ ] CRUD de platform users
- [ ] Dashboard de billing
- [ ] Métricas do sistema
- [ ] Visualização de logs

---

## Entregas Gerais

### Autenticação

```typescript
// src/services/auth.ts
interface AuthService {
  login(email: string, password: string): Promise<AuthResponse>;
  logout(): Promise<void>;
  refresh(): Promise<AuthResponse>;
  getMe(): Promise<User>;
}

// src/stores/auth.store.ts
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### API Client

```typescript
// src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Tentar refresh ou logout
    }
    return Promise.reject(error);
  }
);
```

### React Query Hooks

```typescript
// src/features/sensors/hooks/useSensors.ts
export function useSensors(filters?: SensorFilters) {
  return useQuery({
    queryKey: ['sensors', filters],
    queryFn: () => sensorService.list(filters),
  });
}

export function useSensor(id: string) {
  return useQuery({
    queryKey: ['sensors', id],
    queryFn: () => sensorService.getById(id),
  });
}

export function useCreateSensor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sensorService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
    },
  });
}
```

---

## Critérios de Conclusão

A Fase 5 está completa quando:

**App Cliente:**
1. [ ] Login/logout funciona
2. [ ] Dashboard mostra dados reais
3. [ ] Lista de sensores com filtros
4. [ ] Detalhe do sensor com gráficos
5. [ ] Lista de alertas com ações
6. [ ] Configuração de regras
7. [ ] Gestão de usuários (ADMIN)
8. [ ] Responsivo (mobile-friendly)

**App Admin:**
9. [ ] Login admin funciona
10. [ ] Dashboard com métricas globais
11. [ ] CRUD de tenants
12. [ ] Impersonate funciona
13. [ ] CRUD de platform users
14. [ ] Dashboard de billing básico

**Qualidade:**
15. [ ] Testes E2E principais
16. [ ] Performance adequada (<3s load)
17. [ ] Acessibilidade básica (a11y)

---

## Dependências NPM

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "axios": "^1.x",
    "recharts": "^2.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",
    "date-fns": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "@playwright/test": "^1.x"
  }
}
```

---

## Variáveis de Ambiente

```env
# .env.development
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=IoT Sensores

# .env.production
VITE_API_URL=https://api.seudominio.com
VITE_APP_NAME=IoT Sensores
```

---

## Deploy

### Opções de Hospedagem

| Opção | Custo | Facilidade |
|-------|-------|------------|
| Vercel | Free tier | Fácil |
| Netlify | Free tier | Fácil |
| Railway (static) | ~$5/mês | Médio |
| Cloudflare Pages | Free | Médio |

### Build & Deploy

```bash
# Build
npm run build

# Preview local
npm run preview

# Deploy (Vercel)
vercel --prod
```

---

## Próxima Fase

Após completar a Fase 5, seguir para [Fase 6 — Hardware/Firmware](fase-6-hardware.md).
