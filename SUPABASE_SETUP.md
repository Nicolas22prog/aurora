# Integração Supabase - Grand Prize Raffle

## 📋 Configuração

### 1. Obter as Credenciais do Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Crie um novo projeto
4. Na seção **Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Configurar as Variáveis de Ambiente

Edite o arquivo `.env.local` e preencha com suas credenciais:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 3. Criar a Tabela no Supabase

No SQL Editor do Supabase, execute este comando:

```sql
CREATE TABLE numero (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  numeros INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para melhor performance
CREATE INDEX idx_numero_nome ON numero(nome);
CREATE INDEX idx_numero_telefone ON numero(telefone);
```

### 4. (Opcional) Configurar RLS (Row Level Security)

Se desejar adicionar segurança com RLS:

```sql
ALTER TABLE numero ENABLE ROW LEVEL SECURITY;

-- Política para inserir dados
CREATE POLICY "Allow public insert" ON numero
  FOR INSERT
  WITH CHECK (true);

-- Política para ler dados
CREATE POLICY "Allow public read" ON numero
  FOR SELECT
  USING (true);
```

## 📚 Estrutura da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único (gerado automaticamente) |
| nome | VARCHAR(255) | Nome completo do participante |
| telefone | VARCHAR(20) | Número de telefone |
| numeros | INTEGER[] | Array de números selecionados |
| created_at | TIMESTAMP | Data/hora de criação |
| updated_at | TIMESTAMP | Data/hora da última atualização |

## 🔧 Arquivos Criados/Modificados

- **`lib/supabase.ts`** - Configuração do cliente Supabase e funções de banco de dados
- **`app/api/raffle/submit.ts`** - Endpoint POST para salvar participações
- **`components/grand-prize-raffle.tsx`** - Componente atualizado com integração
- **`.env.local`** - Variáveis de ambiente (não commitar!)

## 🚀 Como Usar

1. Preencha o nome e telefone
2. Selecione os números desejados
3. Clique em "Enter Raffle"
4. Os dados serão salvos automaticamente no Supabase

## ✅ Validações

- Nome e telefone obrigatórios
- Pelo menos um número deve ser selecionado
- Números duplicados são automaticamente ordenados antes de salvar
- Erros são exibidos em tempo real na interface

## 📱 Exemplo de Dados Salvos

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nome": "João Silva",
  "telefone": "(11) 98765-4321",
  "numeros": [5, 12, 25, 42, 89],
  "created_at": "2025-11-12T15:30:00Z",
  "updated_at": "2025-11-12T15:30:00Z"
}
```

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se as variáveis estão definidas em `.env.local`
- Reinicie o servidor de desenvolvimento

### Erro: "Could not resolve dependency"
- Execute: `npm install --legacy-peer-deps`

### Dados não são salvos
- Verifique a tabela `numero` foi criada corretamente
- Confirme as credenciais do Supabase
- Verifique os logs do navegador (F12) para mensagens de erro

## 📖 Documentação Útil

- [Supabase Docs](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
