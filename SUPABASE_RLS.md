# 🔓 Como Desabilitar RLS no Supabase

Se você recebeu o erro:
```
new row violates row-level security policy for table "numero"
```

Siga estes passos:

## 📋 Solução Rápida (Desabilitar RLS)

1. **Acesse o Supabase Dashboard**
   - Abra https://app.supabase.com

2. **Selecione seu projeto**

3. **Vá para SQL Editor**
   - Menu esquerdo → SQL Editor

4. **Execute este comando:**
   ```sql
   ALTER TABLE numero DISABLE ROW LEVEL SECURITY;
   ```

5. **Clique em "Run"**
   - Aguarde a confirmação

6. **Teste novamente**
   - Volte para o app e clique em "Enter Raffle"

## ✅ Verificar se Funcionou

Se a mensagem "Participação registrada com sucesso!" aparecer, está funcionando!

## 🔐 Solução Segura (Manter RLS com Políticas)

Se preferir manter RLS habilitado por segurança:

1. Abra **SQL Editor** no Supabase

2. Execute este script completo:

```sql
-- Habilitar RLS
ALTER TABLE numero ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow public insert" ON numero;
DROP POLICY IF EXISTS "Allow public select" ON numero;
DROP POLICY IF EXISTS "Allow public update" ON numero;
DROP POLICY IF EXISTS "Allow public delete" ON numero;

-- Criar política de INSERT
CREATE POLICY "Allow public insert" ON numero
  FOR INSERT
  WITH CHECK (true);

-- Criar política de SELECT
CREATE POLICY "Allow public select" ON numero
  FOR SELECT
  USING (true);

-- Criar política de UPDATE
CREATE POLICY "Allow public update" ON numero
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Criar política de DELETE (opcional)
CREATE POLICY "Allow public delete" ON numero
  FOR DELETE
  USING (true);
```

3. Clique em "Run"

4. Teste novamente

## 🎯 Qual Escolher?

- **Desabilitar RLS**: Mais simples, mas qualquer pessoa pode ler/escrever tudo
- **Manter RLS**: Mais seguro, controla quem acessa o quê

Para uma rifa pública, ambas funcionam. Escolha a que se sentir mais confortável!

## ❓ Dúvidas?

Verifique a URL e o documento `CORRECAO_COLUNA_NUMERO.md` para mais informações.
