# Dashboard Components - Documentação

## Visão Geral

O sistema de dashboard foi componentizado para suportar dois tipos de usuários:

1. **Admin Ambio**: Visualiza todas as empresas do sistema
2. **Usuário de Empresa**: Visualiza apenas os sensores da sua empresa

## Arquitetura de Navegação

```
ADMIN AMBIO:
  Home (/)
    └── Lista de empresas (AdminDashboard)
          └── Clique na empresa
                └── Detalhe da empresa (/companies/:id)
                      └── Lista de sensores
                            └── Clique no sensor
                                  └── Detalhe do sensor (/sensors/:serialNumber)

USUÁRIO EMPRESA:
  Home (/)
    └── Lista de sensores (CompanyDashboard)
          └── Clique no sensor
                └── Detalhe do sensor (/sensors/:serialNumber)
```

---

## Componentes Criados

### 1. StatCard

**Localização**: `src/components/common/StatCard.jsx`

Card genérico para exibição de estatísticas.

**Props**:
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `icon` | Component | - | Ícone do Lucide React |
| `label` | string | - | Rótulo da estatística |
| `value` | string/number | - | Valor a ser exibido |
| `iconBgColor` | string | `'bg-blue-500'` | Classe Tailwind para cor de fundo do ícone |
| `iconColor` | string | `'text-white'` | Classe Tailwind para cor do ícone |

**Exemplo de uso**:
```jsx
import { StatCard } from '../components/common/StatCard';
import { Thermometer } from 'lucide-react';

<StatCard
  icon={Thermometer}
  label="Temperatura Média"
  value="24.5°C"
  iconBgColor="bg-red-100"
  iconColor="text-red-600"
/>
```

---

### 2. StatsOverview

**Localização**: `src/components/dashboard/StatsOverview.jsx`

Contém dois componentes para visões de estatísticas:

#### SensorStatsOverview

Exibe estatísticas calculadas a partir de uma lista de sensores.

**Props**:
| Prop | Tipo | Descrição |
|------|------|-----------|
| `sensors` | array | Lista de sensores com dados de última leitura |

**Estatísticas calculadas**:
- Sensores ativos (com leitura nas últimas 24h)
- Temperatura média
- Umidade média
- Sensores com bateria baixa (< 20%)

**Exemplo de uso**:
```jsx
import { SensorStatsOverview } from '../components/dashboard/StatsOverview';

<SensorStatsOverview sensors={sensorsData} />
```

#### AdminStatsOverview

Exibe estatísticas para o painel administrativo.

**Props**:
| Prop | Tipo | Descrição |
|------|------|-----------|
| `companies` | array | Lista de empresas |
| `totalSensors` | number | Total de sensores no sistema |
| `totalUsers` | number | Total de usuários no sistema |

**Exemplo de uso**:
```jsx
import { AdminStatsOverview } from '../components/dashboard/StatsOverview';

<AdminStatsOverview
  companies={companiesData}
  totalSensors={150}
  totalUsers={45}
/>
```

---

### 3. RecentReadingsChart

**Localização**: `src/components/dashboard/RecentReadingsChart.jsx`

Gráfico de leituras recentes de temperatura e umidade.

**Props**:
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `sensorId` | string | - | Serial number do sensor (opcional) |
| `limit` | number | `50` | Número de leituras a buscar |
| `title` | string | `'Leituras Recentes'` | Título do card |

**Exemplo de uso**:
```jsx
import { RecentReadingsChart } from '../components/dashboard/RecentReadingsChart';

// Todas as leituras recentes
<RecentReadingsChart limit={50} />

// Leituras de um sensor específico
<RecentReadingsChart
  sensorId="ABC123"
  limit={30}
  title="Histórico do Sensor"
/>
```

---

### 4. CompanyCard

**Localização**: `src/components/companies/CompanyCard.jsx`

Card clicável para exibição de empresa.

**Props**:
| Prop | Tipo | Descrição |
|------|------|-----------|
| `company` | object | Objeto da empresa |
| `linkTo` | string | URL de destino ao clicar |

**Estrutura do objeto company**:
```js
{
  id: string,
  name: string,
  cnpj: string,
  is_active: boolean,
  sensor_count: number,
  user_count: number
}
```

**Exemplo de uso**:
```jsx
import { CompanyCard } from '../components/companies/CompanyCard';

<CompanyCard
  company={companyData}
  linkTo={`/companies/${companyData.id}`}
/>
```

---

### 5. CompaniesGrid

**Localização**: `src/components/companies/CompaniesGrid.jsx`

Grid responsivo de cards de empresas.

**Props**:
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `companies` | array | - | Lista de empresas |
| `isLoading` | boolean | `false` | Estado de carregamento |
| `emptyMessage` | string | `'Nenhuma empresa encontrada.'` | Mensagem quando vazio |

**Exemplo de uso**:
```jsx
import { CompaniesGrid } from '../components/companies/CompaniesGrid';

<CompaniesGrid
  companies={companiesData}
  isLoading={isLoading}
  emptyMessage="Nenhuma empresa cadastrada no sistema."
/>
```

---

### 6. SensorCard (Modificado)

**Localização**: `src/components/sensors/SensorCard.jsx`

Card de sensor com suporte a caminho base customizável.

**Props adicionadas**:
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `basePath` | string | `'/sensors'` | Caminho base para o link |

**Exemplo de uso**:
```jsx
import { SensorCard } from '../components/sensors/SensorCard';

// Link padrão: /sensors/:serialNumber
<SensorCard sensor={sensorData} />

// Link customizado: /companies/123/sensors/:serialNumber
<SensorCard
  sensor={sensorData}
  basePath="/companies/123/sensors"
/>
```

---

### 7. SensorList (Modificado)

**Localização**: `src/components/sensors/SensorList.jsx`

Lista/grid de sensores com props adicionais.

**Props adicionadas**:
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `basePath` | string | `'/sensors'` | Caminho base para links |
| `isLoading` | boolean | `false` | Estado de carregamento |
| `emptyMessage` | string | `'Nenhum sensor encontrado.'` | Mensagem quando vazio |

**Exemplo de uso**:
```jsx
import { SensorList } from '../components/sensors/SensorList';

<SensorList
  sensors={sensorsData}
  basePath="/sensors"
  isLoading={isLoading}
  emptyMessage="Nenhum sensor cadastrado para esta empresa."
/>
```

---

## Páginas de Dashboard

### Dashboard.jsx

**Localização**: `src/pages/Dashboard.jsx`

Componente principal que renderiza condicionalmente baseado no tipo de usuário.

```jsx
export function Dashboard() {
  const { user } = useAuth();
  const isAmbioUser = user?.userType === 'ambio';

  if (isAmbioUser) {
    return <AdminDashboard />;
  }
  return <CompanyDashboard companyId={user?.companyId} />;
}
```

---

### AdminDashboard.jsx

**Localização**: `src/pages/dashboard/AdminDashboard.jsx`

Dashboard para administradores Ambio.

**Componentes utilizados**:
- `AdminStatsOverview`
- `CompaniesGrid`

**Fluxo de dados**:
```
useCompanies() → AdminStatsOverview + CompaniesGrid
```

---

### CompanyDashboard.jsx

**Localização**: `src/pages/dashboard/CompanyDashboard.jsx`

Dashboard para usuários de empresa ou visualização de empresa específica.

**Props**:
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `companyId` | string | - | ID da empresa |
| `showHeader` | boolean | `false` | Exibir cabeçalho com nome da empresa |
| `companyName` | string | - | Nome da empresa (para cabeçalho) |

**Componentes utilizados**:
- `SensorStatsOverview`
- `RecentReadingsChart`
- `SensorList`

**Fluxo de dados**:
```
useSensorsWithFilters({companyId}) → SensorStatsOverview + RecentReadingsChart + SensorList
```

---

## CompanyDetail.jsx (Modificado)

**Localização**: `src/pages/companies/CompanyDetail.jsx`

Página de detalhe da empresa com sistema de tabs.

**Tabs disponíveis**:
1. **Sensores**: Lista de sensores com estatísticas e gráfico
2. **Usuários**: Tabela de usuários da empresa
3. **Informações**: Dados de contato da empresa

**Componentes reutilizados na tab Sensores**:
- `SensorStatsOverview`
- `RecentReadingsChart`
- `SensorList`

---

## Padrão de Reutilização

```
┌─────────────────────────────────────────────────────────────┐
│                        StatCard                              │
│  Usado em: SensorStatsOverview, AdminStatsOverview          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   SensorStatsOverview                        │
│  Usado em: CompanyDashboard, CompanyDetail (tab sensores)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   RecentReadingsChart                        │
│  Usado em: CompanyDashboard, CompanyDetail (tab sensores)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       SensorList                             │
│  Usado em: CompanyDashboard, CompanyDetail, Sensors page    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      CompaniesGrid                           │
│  Usado em: AdminDashboard                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Arquivos

```
src/
├── components/
│   ├── common/
│   │   └── StatCard.jsx
│   ├── companies/
│   │   ├── CompanyCard.jsx
│   │   └── CompaniesGrid.jsx
│   ├── dashboard/
│   │   ├── StatsOverview.jsx
│   │   └── RecentReadingsChart.jsx
│   └── sensors/
│       ├── SensorCard.jsx (modificado)
│       └── SensorList.jsx (modificado)
├── pages/
│   ├── Dashboard.jsx (modificado)
│   ├── dashboard/
│   │   ├── AdminDashboard.jsx
│   │   └── CompanyDashboard.jsx
│   └── companies/
│       └── CompanyDetail.jsx (modificado)
```

---

## Fluxo de Autenticação

O tipo de usuário é determinado pelo campo `userType` no objeto do usuário:

```js
// AuthContext
user = {
  id: string,
  name: string,
  email: string,
  role: string,
  userType: 'ambio' | 'company',
  companyId: string | null,  // null para usuários Ambio
}
```

O backend retorna `company_id` em `/api/auth/me`, que é mapeado para `companyId` no frontend.
