# 🚀 Guia de Deploy - Nexus Gestão de Projetos

## 📋 Checklist Pré-Deploy

### Ambiente e Configuração
- [ ] Variáveis de ambiente configuradas
- [ ] Supabase project criado e configurado
- [ ] Edge Functions deployed
- [ ] Migrations aplicadas
- [ ] Backup automático configurado no Supabase
- [ ] Domain/DNS configurado (se aplicável)

### Código e Build
- [ ] Todas as alterações commitadas
- [ ] `npm run build` executado com sucesso
- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] Lint passou (`npm run lint`)
- [ ] Testes críticos passando (se existirem)

### Segurança
- [ ] `.env` não commitado (deve estar no `.gitignore`)
- [ ] Credenciais sensíveis em variáveis de ambiente
- [ ] RLS (Row Level Security) verificado no Supabase
- [ ] CORS configurado corretamente
- [ ] Rate limiting considerado

### Monitoramento (Recomendado)
- [ ] Error tracking configurado (Sentry, LogRocket)
- [ ] Analytics configurado (GA, Mixpanel)
- [ ] Logs centralizados
- [ ] Alertas configurados

---

## 🔧 Variáveis de Ambiente

### Produção

Criar arquivo `.env.production` ou configurar no painel do seu provedor de hospedagem:

```env
# Supabase - OBRIGATÓRIO
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Google Calendar Integration - OPCIONAL
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-google-api-key

# Sentry - Error Tracking - RECOMENDADO
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Analytics - OPCIONAL
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Como obter as credenciais

#### Supabase
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings > API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

#### Google Calendar (Opcional)
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie/selecione um projeto
3. Ative **Google Calendar API**
4. Crie credenciais OAuth 2.0
5. Configure URLs autorizadas

---

## 📦 Build de Produção

### 1. Instalar Dependências

```bash
npm install
# ou
pnpm install
```

### 2. Executar Build

```bash
npm run build
```

**Saída esperada:**
```
✓ 3921 modules transformed.
dist/index.html                    1.82 kB
dist/assets/index-[hash].css      98.61 kB
dist/assets/index-[hash].js       1.03 MB
✓ built in 32s
```

### 3. Testar Build Localmente

```bash
npm run preview
```

Acesse: `http://localhost:4173`

---

## 🗄️ Supabase Setup

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha:
   - **Name**: nexus-production
   - **Database Password**: [senha forte]
   - **Region**: [mais próxima dos usuários]
4. Aguarde ~2 minutos para provisionar

### 2. Aplicar Migrations

**Opção A: Via Supabase CLI (Recomendado)**

```bash
# Login no Supabase
npx supabase login

# Link ao projeto
npx supabase link --project-ref your-project-id

# Push migrations
npx supabase db push
```

**Opção B: Via Dashboard**

1. Vá em **SQL Editor**
2. Crie nova query
3. Cole o conteúdo de cada migration em `supabase/migrations/`
4. Execute em ordem cronológica

### 3. Deploy Edge Functions

```bash
# Set access token
export SUPABASE_ACCESS_TOKEN="your-access-token"

# Deploy all functions
npx supabase functions deploy validate-project-view --project-ref your-project-id
npx supabase functions deploy create-user --project-ref your-project-id
npx supabase functions deploy validate-invite --project-ref your-project-id
npx supabase functions deploy reset-user-password --project-ref your-project-id
npx supabase functions deploy create-admin-user --project-ref your-project-id
```

### 4. Configurar Storage

1. Vá em **Storage**
2. Crie bucket: `project-documents`
3. Configure políticas RLS:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'project-documents');

   -- Allow users to read their company's files
   CREATE POLICY "Allow company file reads"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'project-documents');
   ```

### 5. Verificar RLS

Execute no SQL Editor:

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'gp_%';
```

Resultado esperado: todas as tabelas com `rowsecurity = true`

---

## 🌐 Deploy Options

### Opção 1: Vercel (Recomendado)

#### Vantagens
- ✅ Deploy automático via Git
- ✅ Preview deployments
- ✅ Edge Functions CDN
- ✅ SSL automático
- ✅ Free tier generoso

#### Passos

1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

4. **Configurar Variáveis de Ambiente**
   - Vá no dashboard da Vercel
   - Settings > Environment Variables
   - Adicione todas as variáveis do `.env.production`

5. **Conectar ao Git (opcional)**
   - Vá em Git > Connect Repository
   - Selecione o repositório
   - Configure build settings:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

---

### Opção 2: Netlify

#### Passos

1. **Instalar Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

4. **Configurar no `netlify.toml`**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Opção 3: Docker + VPS

#### Criar `Dockerfile`

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Criar `nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Build e Deploy

```bash
# Build image
docker build -t nexus-app .

# Run container
docker run -d -p 80:80 --name nexus nexus-app
```

---

## 🔍 Verificação Pós-Deploy

### Checklist

- [ ] Site acessível via URL de produção
- [ ] Login funciona
- [ ] Dashboard carrega corretamente
- [ ] Criar projeto funciona
- [ ] Upload de documentos funciona
- [ ] Link de compartilhamento externo funciona
- [ ] Sistema de reuniões funciona
- [ ] Dark/Light mode alterna
- [ ] Não há erros no console do navegador
- [ ] Não há erros 404 nas requisições
- [ ] Edge Functions respondem corretamente

### Testes Críticos

```bash
# 1. Testar autenticação
# - Fazer login com usuário admin
# - Verificar redirect para dashboard

# 2. Testar CRUD de projetos
# - Criar novo projeto
# - Editar projeto
# - Adicionar tarefa
# - Marcar tarefa como concluída

# 3. Testar link externo
# - Compartilhar projeto
# - Acessar link em aba anônima
# - Verificar se abre em light mode

# 4. Testar reuniões
# - Criar reunião
# - Editar reunião
# - Verificar se aparece na lista
```

---

## 📊 Monitoramento

### Sentry (Error Tracking)

1. **Criar conta**: [sentry.io](https://sentry.io)
2. **Criar projeto React**
3. **Instalar SDK**
```bash
npm install @sentry/react
```

4. **Configurar em `src/main.tsx`**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

### Google Analytics

1. **Criar propriedade** em [analytics.google.com](https://analytics.google.com)
2. **Instalar script** no `index.html`:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🔄 Rollback Strategy

### Se algo der errado

#### Vercel/Netlify
1. Vá no dashboard
2. **Deployments** > Selecione deploy anterior
3. Clique em **Promote to Production**

#### Docker
```bash
# Parar container atual
docker stop nexus

# Remover container
docker rm nexus

# Deploy versão anterior
docker run -d -p 80:80 --name nexus nexus-app:previous
```

#### Manual
1. Fazer checkout do commit anterior
```bash
git checkout <previous-commit-hash>
```
2. Rebuild e redeploy
```bash
npm run build
vercel --prod
```

---

## 🐛 Troubleshooting

### Build Falha

**Erro**: `Module not found` ou `Cannot find module`
```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install
```

### Edge Function 403/401

**Problema**: `Missing authorization header`

**Solução**: Verificar se Edge Function foi deployed corretamente
```bash
npx supabase functions list --project-ref your-project-id
```

### RLS Bloqueando Queries

**Problema**: Queries retornam vazio mesmo com dados

**Solução**: Verificar políticas RLS no Supabase dashboard
1. Vá em **Authentication > Policies**
2. Verifique se há políticas para a tabela
3. Teste políticas com SQL:
```sql
SELECT * FROM gp_projects
WHERE company_id = 'your-company-id';
```

### CORS Errors

**Problema**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solução**: Verificar CORS nas Edge Functions
- Headers devem incluir:
```typescript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}
```

---

## 📝 Maintenance

### Backup Regular

1. **Supabase**: Configurar backup automático no dashboard
2. **Database Export**:
```bash
npx supabase db dump -f backup.sql --project-ref your-project-id
```

### Updates

```bash
# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Fix vulnerabilidades
npm audit fix
```

### Monitorar Performance

- Supabase Dashboard > Statistics
- Vercel/Netlify Analytics
- Google Lighthouse report

---

## 📞 Suporte

### Recursos
- 📚 [Documentação Supabase](https://supabase.com/docs)
- 📚 [Documentação Vite](https://vitejs.dev/)
- 💬 [Supabase Discord](https://discord.supabase.com/)

### Contato
- Email: gruponexusmind@gmail.com
- GitHub: @gruponexusmind

---

✅ **Seu deploy está completo!** 🎉
