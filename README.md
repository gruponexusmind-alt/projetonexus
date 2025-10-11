# 🚀 Nexus - Sistema de Gestão de Projetos

Sistema completo de gestão de projetos para agências e empresas de desenvolvimento, com foco em metodologias ágeis e gestão de equipes.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Sobre o Projeto

O **Nexus** é uma plataforma moderna de gestão de projetos desenvolvida com as melhores tecnologias do mercado. O sistema oferece controle completo do ciclo de vida de projetos, desde o onboarding até a entrega e monitoramento.

### ✨ Principais Funcionalidades

- 📊 **Dashboard Interativo** com métricas em tempo real
- 👥 **Gestão de Clientes** - CRM integrado
- 📁 **Gestão de Projetos** - Pipeline Kanban com 6 etapas
- ✅ **Sistema de Tarefas** - Com prioridades e atribuições
- 📅 **Agenda de Reuniões** - Calendário integrado
- 📂 **Gestão de Documentos** - Upload e versionamento
- 🎯 **Sprints e Metodologia Ágil**
- ⚠️ **Gestão de Riscos** - Identificação e mitigação
- 💬 **Comentários em Tempo Real**
- 🔐 **Sistema de Permissões** - 5 níveis de acesso
- 🌙 **Dark/Light Mode**

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Library UI
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Utility-first CSS
- **shadcn-ui** - Componentes acessíveis (55 componentes)
- **React Router v6** - Roteamento SPA
- **TanStack React Query** - Cache e sincronização de dados
- **React Hook Form + Zod** - Formulários e validação
- **Recharts** - Visualização de dados
- **Lucide React** - Ícones

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL 15+
  - Auth (JWT)
  - Storage
  - Realtime
  - Row Level Security (RLS)

### Infraestrutura
- **Git** - Controle de versão
- **npm/pnpm** - Gerenciamento de pacotes

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Conta no Supabase

### Passo a passo

1. **Clone o repositório**
```bash
git clone <YOUR_GIT_URL>
cd projetonexus
```

2. **Instale as dependências**
```bash
npm install
# ou
pnpm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> 💡 **Como obter as credenciais:**
> 1. Acesse [supabase.com](https://supabase.com)
> 2. Vá em: Project > Settings > API
> 3. Copie a **URL** e **anon public key**

4. **Rode as migrations do banco de dados**
```bash
# Se estiver usando Supabase CLI
npx supabase db push

# OU importe manualmente pelo dashboard do Supabase
# As migrations estão em: supabase/migrations/
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Acesse: **http://localhost:8080**

## 🗄️ Estrutura do Banco de Dados

O projeto usa **35 tabelas** com Row Level Security (RLS) habilitado:

### Principais Tabelas

- `profiles` - Usuários do sistema
- `companies` - Empresas (multi-tenant)
- `gp_clients` - Clientes
- `gp_projects` - Projetos
- `gp_tasks` - Tarefas
- `gp_meetings` - Reuniões
- `gp_documents` - Documentos
- `gp_comments` - Comentários
- `gp_checklist_items` - Checklists
- `configuracoes_*` - Configurações do sistema

### Políticas de Segurança (RLS)

Todas as tabelas possuem políticas baseadas em:
- `company_id` - Isolamento multi-tenant
- `user_id` / `auth.uid()` - Propriedade do usuário
- `role` - Permissões por função

## 👥 Sistema de Permissões

5 níveis de acesso:

| Role | Descrição | Acesso |
|------|-----------|--------|
| **admin** | Administrador | Total |
| **operacional** | Gestor de projetos | Projetos, Tarefas, Reuniões |
| **cliente** | Cliente externo | Apenas seus projetos |
| **financeiro** | Financeiro | Dados financeiros |
| **vendas** | Vendas | Clientes e leads |

## 📁 Estrutura de Pastas

```
projetonexus/
├── public/              # Arquivos estáticos
├── src/
│   ├── components/      # Componentes React
│   │   ├── ui/         # 55 componentes shadcn
│   │   ├── Layout/     # Sidebar, ProtectedRoute
│   │   ├── settings/   # Componentes de Settings
│   │   └── project-details/ # Componentes de ProjectDetails
│   ├── pages/          # Páginas principais (8)
│   ├── hooks/          # Custom hooks (6)
│   ├── lib/            # Utilitários
│   ├── integrations/   # Supabase client
│   ├── data/           # Dados mockados
│   ├── App.tsx         # Componente raiz
│   ├── main.tsx        # Entry point
│   └── index.css       # Estilos globais
├── supabase/
│   ├── migrations/     # 20 migrations SQL
│   └── config.toml     # Config Supabase
├── .env.example        # Template de variáveis
├── .gitignore          # Arquivos ignorados
├── vite.config.ts      # Config Vite
├── tailwind.config.ts  # Config Tailwind
├── tsconfig.json       # Config TypeScript
└── package.json        # Dependências
```

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor dev (porta 8080)

# Build
npm run build        # Build para produção
npm run build:dev    # Build modo desenvolvimento

# Linting
npm run lint         # Verifica código com ESLint

# Preview
npm run preview      # Preview do build de produção
```

## 🔒 Segurança

- ✅ Credenciais em variáveis de ambiente
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas multi-tenant por empresa
- ✅ JWT tokens com refresh automático
- ✅ Validação de formulários com Zod
- ✅ TypeScript strict mode
- ✅ CORS configurado
- ✅ Sanitização de inputs

## 📈 Performance

### Bundle Size (otimizado com code splitting)

- ✅ **index.js**: 428KB (100KB gzip)
- ✅ **react-vendor**: 164KB (53KB gzip)
- ✅ **supabase-vendor**: 165KB (45KB gzip)
- ✅ **charts-vendor**: 359KB (98KB gzip)
- ✅ **ui-vendor**: 114KB (37KB gzip)

Total: ~1.3MB (298KB gzip)

### Otimizações Implementadas

- ⚡ Vite com SWC (compilação ultrarrápida)
- 📦 Code splitting por vendor
- 💾 Cache inteligente com React Query
- 🎯 Lazy loading de componentes
- 🗜️ Compressão gzip/brotli
- 🔄 Prefetch de dados críticos

## 🎨 Customização

### Temas

O projeto usa **next-themes** com suporte a:
- 🌞 Light mode
- 🌙 Dark mode
- 💻 System preference

### Cores

Edite `src/index.css` para customizar as cores:
```css
:root {
  --primary: ...;
  --secondary: ...;
  /* ... */
}
```

### Componentes

Todos os componentes shadcn podem ser customizados em:
```
src/components/ui/
```

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📧 Contato

Projeto Nexus - [@gruponexusmind](mailto:gruponexusmind@gmail.com)

## 🙏 Agradecimentos

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [shadcn-ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lovable](https://lovable.dev/)

---

Feito com ❤️ pelo Grupo Nexus Mind
