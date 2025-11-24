# 🔧 Correção - Nome da Coluna de Números

## ✅ O que foi corrigido:

A coluna que armazena os números selecionados se chama `numero` (e não `numeros`).

### Arquivos Atualizados:

1. **`lib/supabase.ts`**
   - Interface `NumeroRecord` - agora usa `numero` em vez de `numeros`
   - Função `getAllSelectedNumbers()` - agora faz select de `numero` em vez de `numeros`

2. **`app/api/raffle/route.ts`**
   - Função POST - agora salva em `numero` em vez de `numeros`

3. **`sql/numero-table.sql`**
   - Script SQL atualizado com `numero` em vez de `numeros`

## 🗄️ Estrutura da Tabela no Supabase:

```sql
CREATE TABLE numero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  numero INTEGER[] NOT NULL,          -- ← Nome correto da coluna
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## ⚠️ Importante:

Se você já criou a tabela com o nome `numeros`, você precisa fazer um dos seguintes:

### Opção 1: Alterar o nome da coluna (Recomendado se não há dados)
```sql
ALTER TABLE numero RENAME COLUMN numeros TO numero;
```

### Opção 2: Recriar a tabela (Se há dados, primeiro faça backup)
```sql
-- Backup dos dados existentes
CREATE TABLE numero_backup AS SELECT * FROM numero;

-- Remover tabela antiga
DROP TABLE numero;

-- Criar nova tabela com o nome correto
CREATE TABLE numero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  numero INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restaurar dados
INSERT INTO numero (id, nome, telefone, numero, created_at, updated_at)
SELECT id, nome, telefone, numeros, created_at, updated_at FROM numero_backup;

-- Limpar backup
DROP TABLE numero_backup;
```

## � Erro: Row Level Security Policy

Se você está vendo este erro:
```
new row violates row-level security policy for table "numero"
```

**Solução:** Desabilite o RLS na tabela `numero`:

```sql
ALTER TABLE numero DISABLE ROW LEVEL SECURITY;
```

Ou se preferir manter RLS habilitado, execute as políticas corretas:

```sql
ALTER TABLE numero ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Allow public insert" ON numero;
DROP POLICY IF EXISTS "Allow public select" ON numero;
DROP POLICY IF EXISTS "Allow public update" ON numero;

-- Criar novas políticas que permitem acesso público
CREATE POLICY "Allow public insert" ON numero
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public select" ON numero
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public update" ON numero
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

## �🚀 Próximos Passos:

1. Acesse seu projeto no Supabase
2. Vá para **SQL Editor**
3. Execute um dos seguintes:
   - **Opção A (Simples)**: Desabilitar RLS
     ```sql
     ALTER TABLE numero DISABLE ROW LEVEL SECURITY;
     ```
   - **Opção B (Seguro)**: Manter RLS com políticas corretas (use o script acima)

4. Teste clicando em "Enter Raffle" novamente

Pronto! Agora o sistema funcionará corretamente. ✨
