# Componentes - Documentacao Completa

Este documento descreve todos os componentes React do projeto Ambio.

---

## Indice

1. [Componentes Common (UI Base)](#1-componentes-common-ui-base)
2. [Componentes de Layout](#2-componentes-de-layout)
3. [Componentes de Autenticacao](#3-componentes-de-autenticacao)
4. [Componentes de Dashboard](#4-componentes-de-dashboard)
5. [Componentes de Empresas](#5-componentes-de-empresas)
6. [Componentes de Sensores](#6-componentes-de-sensores)
7. [Componentes de Leituras](#7-componentes-de-leituras)
8. [Componentes de Usuarios](#8-componentes-de-usuarios)
9. [Componentes de Perfil](#9-componentes-de-perfil)
10. [Componentes de Graficos](#10-componentes-de-graficos)

---

## 1. Componentes Common (UI Base)

### Button

**Localizacao**: `src/components/common/Button.jsx`

Botao reutilizavel com variantes e estados.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `children` | ReactNode | - | Conteudo do botao |
| `variant` | string | `'primary'` | `'primary'`, `'secondary'`, `'outline'`, `'danger'` |
| `size` | string | `'md'` | `'sm'`, `'md'`, `'lg'` |
| `loading` | boolean | `false` | Exibe spinner de carregamento |
| `disabled` | boolean | `false` | Desabilita o botao |
| `className` | string | `''` | Classes adicionais |

**Exemplo**:
```jsx
<Button variant="primary" loading={isSubmitting}>
  Salvar
</Button>
```

---

### Card, CardHeader

**Localizacao**: `src/components/common/Card.jsx`

Container com borda e sombra.

**Card Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `children` | ReactNode | - | Conteudo do card |
| `className` | string | `''` | Classes adicionais |

**CardHeader Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `title` | string | - | Titulo do card |
| `subtitle` | string | - | Subtitulo opcional |
| `action` | ReactNode | - | Elemento de acao (botao, etc) |

**Exemplo**:
```jsx
<Card>
  <CardHeader title="Usuarios" subtitle="10 registros" action={<Button>Novo</Button>} />
  {/* conteudo */}
</Card>
```

---

### Input

**Localizacao**: `src/components/common/Input.jsx`

Campo de entrada com label e validacao.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `label` | string | - | Label do campo |
| `type` | string | `'text'` | Tipo do input |
| `error` | string | - | Mensagem de erro |
| `icon` | Component | - | Icone Lucide (esquerda) |
| `className` | string | `''` | Classes adicionais |

**Exemplo**:
```jsx
<Input
  label="Email"
  type="email"
  icon={Mail}
  error={errors.email}
  placeholder="seu@email.com"
/>
```

---

### Select

**Localizacao**: `src/components/common/Select.jsx`

Dropdown de selecao.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `value` | string | - | Valor selecionado |
| `onChange` | function | - | Callback de mudanca |
| `options` | array | - | `[{value, label}]` |
| `placeholder` | string | `'Selecione...'` | Placeholder |
| `className` | string | `''` | Classes adicionais |

**Exemplo**:
```jsx
<Select
  value={role}
  onChange={setRole}
  options={[
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'Usuario' },
  ]}
/>
```

---

### SearchInput

**Localizacao**: `src/components/common/SearchInput.jsx`

Campo de busca com debounce.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `value` | string | - | Valor atual |
| `onChange` | function | - | Callback de mudanca |
| `placeholder` | string | `'Buscar...'` | Placeholder |
| `debounceMs` | number | `300` | Tempo de debounce em ms |

**Exemplo**:
```jsx
<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Buscar por nome..."
/>
```

---

### Table

**Localizacao**: `src/components/common/Table.jsx`

Tabela com ordenacao e selecao.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `columns` | array | - | `[{key, label, sortable?, render?, className?}]` |
| `data` | array | - | Dados da tabela |
| `sortBy` | string | - | Coluna de ordenacao |
| `sortOrder` | string | - | `'asc'` ou `'desc'` |
| `onSort` | function | - | Callback de ordenacao |
| `selectable` | boolean | `false` | Habilita checkbox |
| `selectedIds` | array | `[]` | IDs selecionados |
| `onSelectChange` | function | - | Callback de selecao |
| `emptyMessage` | string | `'Nenhum registro encontrado.'` | Mensagem vazia |

**Exemplo**:
```jsx
<Table
  columns={[
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'actions', label: '', render: (row) => <Button>Editar</Button> },
  ]}
  data={users}
  sortBy="name"
  sortOrder="asc"
  onSort={handleSort}
/>
```

---

### Pagination

**Localizacao**: `src/components/common/Pagination.jsx`

Paginacao com navegacao.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `total` | number | Total de itens |
| `limit` | number | Itens por pagina |
| `offset` | number | Offset atual |
| `onChange` | function | Callback com novo offset |

**Exemplo**:
```jsx
<Pagination
  total={100}
  limit={10}
  offset={20}
  onChange={(offset) => setPagination({ ...pagination, offset })}
/>
```

---

### Modal

**Localizacao**: `src/components/common/Modal.jsx`

Modal/Dialog overlay.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `isOpen` | boolean | - | Controla visibilidade |
| `onClose` | function | - | Callback de fechar |
| `title` | string | - | Titulo do modal |
| `children` | ReactNode | - | Conteudo |
| `size` | string | `'md'` | `'sm'`, `'md'`, `'lg'`, `'xl'`, `'full'` |

**Exemplo**:
```jsx
<Modal isOpen={open} onClose={() => setOpen(false)} title="Editar Usuario" size="lg">
  <form>...</form>
</Modal>
```

---

### ConfirmDialog

**Localizacao**: `src/components/common/ConfirmDialog.jsx`

Dialog de confirmacao com acoes.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `isOpen` | boolean | - | Controla visibilidade |
| `onConfirm` | function | - | Callback de confirmacao |
| `onCancel` | function | - | Callback de cancelamento |
| `title` | string | `'Confirmar acao'` | Titulo |
| `message` | string | - | Mensagem |
| `confirmText` | string | `'Confirmar'` | Texto do botao confirmar |
| `cancelText` | string | `'Cancelar'` | Texto do botao cancelar |
| `variant` | string | `'danger'` | `'danger'` ou `'warning'` |
| `isLoading` | boolean | `false` | Estado de carregamento |

**Exemplo**:
```jsx
<ConfirmDialog
  isOpen={confirmOpen}
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
  title="Excluir usuario"
  message="Tem certeza que deseja excluir este usuario?"
  variant="danger"
/>
```

---

### Loading, LoadingPage

**Localizacao**: `src/components/common/Loading.jsx`

Indicadores de carregamento.

**Loading Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `size` | string | `'md'` | `'sm'`, `'md'`, `'lg'` |

**Exemplo**:
```jsx
<Loading size="lg" />
<LoadingPage /> {/* Centralizado na tela */}
```

---

### ErrorMessage

**Localizacao**: `src/components/common/ErrorMessage.jsx`

Alerta de erro.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `message` | string | `'Ocorreu um erro ao carregar os dados.'` | Mensagem |

**Exemplo**:
```jsx
<ErrorMessage message="Erro ao carregar usuarios." />
```

---

### Badge, BatteryBadge

**Localizacao**: `src/components/common/Badge.jsx`

Tags/badges de status.

**Badge Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `children` | ReactNode | - | Conteudo |
| `variant` | string | `'default'` | `'default'`, `'success'`, `'warning'`, `'danger'`, `'info'` |

**BatteryBadge Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `level` | number | Nivel de bateria (0-100) |

**Exemplo**:
```jsx
<Badge variant="success">Ativo</Badge>
<BatteryBadge level={85} />
```

---

### Avatar, AvatarUpload

**Localizacao**: `src/components/common/Avatar.jsx`, `src/components/common/AvatarUpload.jsx`

Componentes de avatar.

**Avatar Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `src` | string | - | URL da imagem |
| `name` | string | - | Nome (para iniciais) |
| `size` | string | `'md'` | `'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`, `'2xl'` |
| `showInitials` | boolean | `true` | Mostrar iniciais se sem imagem |

**AvatarUpload Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `currentAvatarUrl` | string | - | URL atual |
| `name` | string | - | Nome |
| `onUpload` | function | - | Callback de upload |
| `onRemove` | function | - | Callback de remocao |
| `isUploading` | boolean | `false` | Estado de upload |
| `size` | string | `'xl'` | Tamanho |

**Exemplo**:
```jsx
<Avatar name="Joao Silva" size="lg" />
<AvatarUpload
  currentAvatarUrl={user.avatarUrl}
  name={user.name}
  onUpload={handleUpload}
  onRemove={handleRemove}
/>
```

---

### TabsNav, TabPanel

**Localizacao**: `src/components/common/TabsNav.jsx`

Navegacao por tabs.

**TabsNav Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `tabs` | array | `[{id, label, icon?, badge?}]` |
| `activeTab` | string | ID da tab ativa |
| `onChange` | function | Callback de mudanca |

**TabPanel Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `children` | ReactNode | Conteudo |
| `isActive` | boolean | Se esta ativa |

**Exemplo**:
```jsx
<TabsNav
  tabs={[
    { id: 'info', label: 'Informacoes', icon: Info },
    { id: 'users', label: 'Usuarios', badge: 5 },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
<TabPanel isActive={activeTab === 'info'}>...</TabPanel>
<TabPanel isActive={activeTab === 'users'}>...</TabPanel>
```

---

### ToggleSwitch, ToggleSwitchGroup

**Localizacao**: `src/components/common/ToggleSwitch.jsx`

Switch toggle com label.

**ToggleSwitch Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `checked` | boolean | - | Estado |
| `onChange` | function | - | Callback |
| `label` | string | - | Label |
| `description` | string | - | Descricao |
| `disabled` | boolean | `false` | Desabilitado |

**ToggleSwitchGroup Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `children` | ReactNode | ToggleSwitches |
| `title` | string | Titulo do grupo |
| `description` | string | Descricao |

**Exemplo**:
```jsx
<ToggleSwitchGroup title="Notificacoes">
  <ToggleSwitch
    checked={alertsEnabled}
    onChange={setAlertsEnabled}
    label="Alertas por email"
    description="Receber alertas quando sensores ultrapassarem limites"
  />
</ToggleSwitchGroup>
```

---

### InfoField, InfoFieldGroup, InfoFieldDivider

**Localizacao**: `src/components/common/InfoField.jsx`

Campos de informacao readonly.

**InfoField Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `label` | string | - | Label |
| `value` | string | - | Valor |
| `icon` | Component | - | Icone |
| `editable` | boolean | `false` | Mostra botao editar |
| `onEdit` | function | - | Callback de edicao |
| `emptyText` | string | `'-'` | Texto quando vazio |

**Exemplo**:
```jsx
<InfoFieldGroup>
  <InfoField label="Nome" value={user.name} icon={User} editable onEdit={handleEdit} />
  <InfoField label="Email" value={user.email} icon={Mail} />
  <InfoFieldDivider />
  <InfoField label="Cadastro" value={formatDate(user.createdAt)} icon={Calendar} />
</InfoFieldGroup>
```

---

### StatCard

**Localizacao**: `src/components/common/StatCard.jsx`

Card de estatistica.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `icon` | Component | - | Icone Lucide |
| `label` | string | - | Label |
| `value` | string/number | - | Valor |
| `iconBgColor` | string | `'bg-blue-500'` | Cor de fundo do icone |
| `iconColor` | string | `'text-white'` | Cor do icone |

**Exemplo**:
```jsx
<StatCard
  icon={Thermometer}
  label="Temperatura Media"
  value="24.5C"
  iconBgColor="bg-red-100"
  iconColor="text-red-600"
/>
```

---

## 2. Componentes de Layout

### Layout

**Localizacao**: `src/components/layout/Layout.jsx`

Layout principal com header.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `children` | ReactNode | Conteudo da pagina |

**Exemplo**:
```jsx
<Layout>
  <Dashboard />
</Layout>
```

---

### Header

**Localizacao**: `src/components/layout/Header.jsx`

Header com navegacao e menu de usuario.

**Funcionalidades**:
- Logo e nome do app
- Links de navegacao (Dashboard, Sensores, Leituras, Usuarios, Empresas)
- Menu dropdown do usuario com logout
- Links condicionais baseados em role/userType

---

### AuthLayout

**Localizacao**: `src/components/layout/AuthLayout.jsx`

Layout para paginas de autenticacao.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `children` | ReactNode | Formulario de auth |

**Exemplo**:
```jsx
<AuthLayout>
  <LoginForm />
</AuthLayout>
```

---

## 3. Componentes de Autenticacao

### ProtectedRoute

**Localizacao**: `src/components/auth/ProtectedRoute.jsx`

HOC para proteger rotas autenticadas.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `children` | ReactNode | Conteudo protegido |

**Comportamento**:
- Se loading: mostra `<Loading />`
- Se nao autenticado: redireciona para `/login`
- Se autenticado: renderiza children

**Exemplo**:
```jsx
<Route path="/*" element={
  <ProtectedRoute>
    <Layout>
      <Routes>...</Routes>
    </Layout>
  </ProtectedRoute>
} />
```

---

## 4. Componentes de Dashboard

### SensorStatsOverview

**Localizacao**: `src/components/dashboard/StatsOverview.jsx`

Estatisticas calculadas de sensores.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `sensors` | array | Lista de sensores |

**Estatisticas**:
- Sensores ativos (leitura nas ultimas 24h)
- Temperatura media
- Umidade media
- Sensores com bateria baixa

---

### AdminStatsOverview

**Localizacao**: `src/components/dashboard/StatsOverview.jsx`

Estatisticas para admin.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `companies` | array | Lista de empresas |
| `totalSensors` | number | Total de sensores |
| `totalUsers` | number | Total de usuarios |

---

### RecentReadingsChart

**Localizacao**: `src/components/dashboard/RecentReadingsChart.jsx`

Grafico de leituras recentes.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `sensorId` | string | - | Serial number (opcional) |
| `limit` | number | `50` | Numero de leituras |
| `title` | string | `'Leituras Recentes'` | Titulo |

---

## 5. Componentes de Empresas

### CompanyCard

**Localizacao**: `src/components/companies/CompanyCard.jsx`

Card clicavel de empresa.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `company` | object | `{id, name, cnpj, is_active, sensor_count, user_count}` |
| `linkTo` | string | URL de destino |

---

### CompaniesGrid

**Localizacao**: `src/components/companies/CompaniesGrid.jsx`

Grid de cards de empresas.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `companies` | array | - | Lista de empresas |
| `isLoading` | boolean | `false` | Carregando |
| `emptyMessage` | string | `'Nenhuma empresa encontrada.'` | Mensagem vazia |

---

### CompaniesTable

**Localizacao**: `src/components/companies/CompaniesTable.jsx`

Tabela de empresas com acoes.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `companies` | array | Dados |
| `sortBy` | string | Coluna de ordenacao |
| `sortOrder` | string | `'asc'` ou `'desc'` |
| `onSort` | function | Callback de ordenacao |
| `onView` | function | Callback visualizar |
| `onEdit` | function | Callback editar |
| `onDelete` | function | Callback excluir |
| `onToggleActive` | function | Callback ativar/desativar |

---

### CompanyProfileHeader

**Localizacao**: `src/components/company/CompanyProfileHeader.jsx`

Header de perfil da empresa.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `company` | object | Dados da empresa |
| `isLoading` | boolean | Carregando |

---

### CompanyInfoForm

**Localizacao**: `src/components/company/CompanyInfoForm.jsx`

Formulario de informacoes da empresa.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `company` | object | Dados |
| `canEdit` | boolean | Permite edicao |
| `onSave` | function | Callback salvar |
| `isSaving` | boolean | Salvando |

---

### CompanySensorsOverview

**Localizacao**: `src/components/company/CompanySensorsOverview.jsx`

Visao geral dos sensores da empresa.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `sensors` | array | Sensores |
| `isLoading` | boolean | Carregando |

---

### CompanyUsersManager

**Localizacao**: `src/components/company/CompanyUsersManager.jsx`

Gerenciador de usuarios da empresa.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `users` | array | Usuarios |
| `isLoading` | boolean | Carregando |
| `canEdit` | boolean | Permite edicao |
| `onCreateUser` | function | Criar usuario |
| `onUpdateUser` | function | Atualizar usuario |
| `isCreating` | boolean | Criando |
| `isUpdating` | boolean | Atualizando |

---

### CompanyUserModal

**Localizacao**: `src/components/company/CompanyUserModal.jsx`

Modal de criar/editar usuario da empresa.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `isOpen` | boolean | Visivel |
| `onClose` | function | Fechar |
| `user` | object | Usuario (null = criar) |
| `onSave` | function | Salvar |
| `isSaving` | boolean | Salvando |

---

## 6. Componentes de Sensores

### SensorCard

**Localizacao**: `src/components/sensors/SensorCard.jsx`

Card de sensor com link.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `sensor` | object | - | Dados do sensor |
| `basePath` | string | `'/sensors'` | Base do link |

---

### SensorList

**Localizacao**: `src/components/sensors/SensorList.jsx`

Grid de cards de sensores.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `sensors` | array | - | Sensores |
| `basePath` | string | `'/sensors'` | Base dos links |
| `isLoading` | boolean | `false` | Carregando |
| `emptyMessage` | string | `'Nenhum sensor encontrado.'` | Mensagem vazia |

---

### SensorConfigurationModal

**Localizacao**: `src/components/sensors/SensorConfigurationModal.jsx`

Modal de configuracao do sensor.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `isOpen` | boolean | Visivel |
| `onClose` | function | Fechar |
| `sensor` | object | Sensor |
| `onSuccess` | function | Callback sucesso |

**Configuracoes**:
- Local de instalacao
- Limites de temperatura (min/max)
- Limites de umidade (min/max)
- Alertas habilitados

---

## 7. Componentes de Leituras

### ReadingsTable

**Localizacao**: `src/components/readings/ReadingsTable.jsx`

Tabela de leituras de sensores.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `readings` | array | Leituras |

**Colunas**:
- Sensor (link)
- Temperatura
- Umidade
- Bateria (badge)
- Data

---

### Pagination (Readings)

**Localizacao**: `src/components/readings/Pagination.jsx`

Paginacao simplificada para leituras.

**Props**:
| Prop | Tipo | Descricao |
|------|------|-----------|
| `page` | number | Pagina atual |
| `totalPages` | number | Total de paginas |
| `onPageChange` | function | Callback mudanca |

---

## 8. Componentes de Usuarios

### UserFilters

**Localizacao**: `src/components/users/UserFilters.jsx`

Filtros para lista de usuarios.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `filters` | object | - | `{search, userType, companyId, role, isActive}` |
| `onFilterChange` | function | - | Callback |
| `showUserType` | boolean | `true` | Mostrar filtro tipo |
| `companies` | array | `[]` | Empresas para filtro |

---

### UsersTable

**Localizacao**: `src/components/users/UsersTable.jsx`

Tabela de usuarios com acoes.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `users` | array | - | Usuarios |
| `sortBy` | string | - | Coluna ordenacao |
| `sortOrder` | string | - | `'asc'` ou `'desc'` |
| `onSort` | function | - | Callback ordenacao |
| `onEdit` | function | - | Callback editar |
| `onDelete` | function | - | Callback excluir |
| `onToggleActive` | function | - | Callback ativar/desativar |
| `showCompany` | boolean | `true` | Mostrar coluna empresa |

---

## 9. Componentes de Perfil

### ProfileHeader

**Localizacao**: `src/components/profile/ProfileHeader.jsx`

Header do perfil com avatar.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `user` | object | - | Usuario |
| `onAvatarUpload` | function | - | Upload avatar |
| `onAvatarRemove` | function | - | Remover avatar |
| `isUploadingAvatar` | boolean | `false` | Uploading |

---

### PersonalInfoForm

**Localizacao**: `src/components/profile/PersonalInfoForm.jsx`

Formulario de informacoes pessoais.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `user` | object | - | Usuario |
| `onSave` | function | - | Salvar |
| `isSaving` | boolean | `false` | Salvando |

---

### PasswordChangeForm

**Localizacao**: `src/components/profile/PasswordChangeForm.jsx`

Formulario de troca de senha.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `onSubmit` | function | - | `({currentPassword, newPassword}) => Promise` |
| `isLoading` | boolean | `false` | Carregando |

---

### NotificationSettings

**Localizacao**: `src/components/profile/NotificationSettings.jsx`

Configuracoes de notificacao.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `preferences` | object | - | `{notifications: {...}}` |
| `onSave` | function | - | Salvar preferencias |
| `isSaving` | boolean | `false` | Salvando |

**Opcoes**:
- Alertas de sensores
- Relatorios periodicos
- Atualizacoes do sistema

---

## 10. Componentes de Graficos

### TimeSeriesChart

**Localizacao**: `src/components/charts/TimeSeriesChart.jsx`

Grafico de linha para series temporais.

**Props**:
| Prop | Tipo | Padrao | Descricao |
|------|------|--------|-----------|
| `data` | array | - | `[{received_at, temperature, humidity}]` |
| `showTemperature` | boolean | `true` | Mostrar linha temperatura |
| `showHumidity` | boolean | `true` | Mostrar linha umidade |
| `height` | number | `300` | Altura em pixels |

**Exemplo**:
```jsx
<TimeSeriesChart
  data={readings}
  showTemperature={true}
  showHumidity={true}
  height={400}
/>
```

---

## Estrutura de Arquivos

```
src/components/
├── auth/
│   └── ProtectedRoute.jsx
├── charts/
│   └── TimeSeriesChart.jsx
├── common/
│   ├── Avatar.jsx
│   ├── AvatarUpload.jsx
│   ├── Badge.jsx
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── ConfirmDialog.jsx
│   ├── ErrorMessage.jsx
│   ├── InfoField.jsx
│   ├── Input.jsx
│   ├── Loading.jsx
│   ├── Modal.jsx
│   ├── Pagination.jsx
│   ├── SearchInput.jsx
│   ├── Select.jsx
│   ├── StatCard.jsx
│   ├── Table.jsx
│   ├── TabsNav.jsx
│   └── ToggleSwitch.jsx
├── companies/
│   ├── CompaniesGrid.jsx
│   ├── CompaniesTable.jsx
│   └── CompanyCard.jsx
├── company/
│   ├── CompanyInfoForm.jsx
│   ├── CompanyProfileHeader.jsx
│   ├── CompanySensorsOverview.jsx
│   ├── CompanyUserModal.jsx
│   └── CompanyUsersManager.jsx
├── dashboard/
│   ├── RecentReadingsChart.jsx
│   └── StatsOverview.jsx
├── layout/
│   ├── AuthLayout.jsx
│   ├── Header.jsx
│   └── Layout.jsx
├── profile/
│   ├── NotificationSettings.jsx
│   ├── PasswordChangeForm.jsx
│   ├── PersonalInfoForm.jsx
│   └── ProfileHeader.jsx
├── readings/
│   ├── Pagination.jsx
│   └── ReadingsTable.jsx
├── sensors/
│   ├── SensorCard.jsx
│   ├── SensorConfigurationModal.jsx
│   └── SensorList.jsx
└── users/
    ├── UserFilters.jsx
    └── UsersTable.jsx
```

---

## Convencoes

1. **Localizacao**: Componentes em `src/components/[categoria]/`
2. **Nomenclatura**: PascalCase para componentes
3. **Exports**: Named exports (nao default)
4. **Estilizacao**: Tailwind CSS
5. **Icones**: Lucide React
6. **Estado**: React Query para dados do servidor, useState para UI
