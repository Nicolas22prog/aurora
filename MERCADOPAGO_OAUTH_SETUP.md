# 🔐 Integração OAuth do Mercado Pago - Guia de Configuração

## 📋 Pré-requisitos

1. Conta ativa no Mercado Pago
2. Projeto Next.js com Supabase configurado
3. Acesso à conta como gerente/admin

## 🔧 Passos de Configuração

### 1. Criar Aplicação no Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel)
2. No menu, vá para **Aplicações** → **Minhas aplicações**
3. Clique em **Criar aplicação**
4. Selecione:
   - **Tipo de aplicação**: Web App
   - **Nome**: Aurora Rifa (ou seu nome preferido)
   - **Categorias**: E-commerce / Sorteios

### 2. Copiar Credenciais OAuth

Após criar a aplicação, você verá:
- **Client ID** - copie este valor
- **Client Secret** - copie este valor (mantenha seguro!)

### 3. Configurar URLs de Redirect

Na configuração da aplicação, defina as URLs autorizadas:

```
Redirect URLs:
- http://localhost:3000/admin (desenvolvimento)
- https://seu-dominio.com/admin (produção)
```

### 4. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` e adicione:

```bash
# OAuth Mercado Pago
MERCADOPAGO_CLIENT_ID=seu_client_id_aqui
MERCADOPAGO_CLIENT_SECRET=seu_client_secret_aqui
NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID=seu_client_id_aqui

# Mantém o antigo para fallback (opcional)
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
```

### 5. Criar Tabela no Supabase

Execute o SQL no editor do Supabase:

```sql
-- Ver arquivo: sql/mercadopago-credentials.sql
```

Ou execute diretamente:

```sql
CREATE TABLE IF NOT EXISTS mercadopago_credentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id VARCHAR(255) NOT NULL UNIQUE,
  account_email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50),
  expires_in INTEGER,
  scope TEXT,
  public_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mercadopago_account_id ON mercadopago_credentials(account_id);

ALTER TABLE mercadopago_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow backend to read MP credentials" ON mercadopago_credentials
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin to insert MP credentials" ON mercadopago_credentials
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow admin to update MP credentials" ON mercadopago_credentials
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

## 🎯 Como Usar

### Para Admin Conectar a Conta

1. Acesse `http://localhost:3000/admin`
2. Clique em "Conectar Mercado Pago via OAuth"
3. Você será redirecionado para o Mercado Pago
4. Faça login com sua conta do Mercado Pago
5. Autorize a aplicação
6. Será redirecionado de volta com as credenciais salvas

### Para Clientes Comprarem

1. Cliente seleciona números na página principal
2. Clica em "Comprar"
3. Sistema busca credenciais do banco de dados
4. Cria pagamento usando token da conta conectada
5. Cliente é redirecionado para pagar no Mercado Pago

## 📂 Estrutura de Arquivos Criados

```
app/
├── admin/
│   └── page.tsx                           # Interface de conexão OAuth
└── api/
    ├── auth/
    │   └── mercadopago/
    │       └── callback/
    │           └── route.ts               # Callback OAuth
    └── admin/
        └── mercadopago/
            ├── credentials/
            │   └── route.ts               # GET credenciais
            └── disconnect/
                └── route.ts               # POST desconectar

lib/
├── mercadopago.ts                        # Modificado para usar token do banco
└── supabase.ts

sql/
└── mercadopago-credentials.sql           # Schema da tabela
```

## 🔄 Fluxo de Autenticação

```
1. Admin clica em "Conectar"
   ↓
2. Redireciona para auth.mercadopago.com
   ↓
3. Admin autoriza aplicação
   ↓
4. Mercado Pago redireciona com código para /admin?code=xxx
   ↓
5. Frontend chama POST /api/auth/mercadopago/callback
   ↓
6. Backend troca código por access_token
   ↓
7. Backend obtém dados da conta (email, id)
   ↓
8. Salva no Supabase (upsert para atualizar)
   ↓
9. Retorna credenciais para mostrar na tela
```

## 🚀 Próximas Melhorias

- [ ] Adicionar refresh automático de tokens expirados
- [ ] Histórico de conexões/desconexões
- [ ] Múltiplas contas do Mercado Pago
- [ ] Teste automático de conexão
- [ ] Webhook para renovar token antes de expirar

## ⚠️ Notas Importantes

1. **Segurança**: O `client_secret` deve SEMPRE ficar no `.env.local` (nunca commit)
2. **Fallback**: Se nenhuma credencial estiver no banco, usa a variável de ambiente
3. **Localhost**: Em desenvolvimento, certifique-se que `NEXT_PUBLIC_URL` está vazio
4. **Produção**: Configure as URLs de redirect para seu domínio final
5. **Persistência**: Os tokens são salvos no Supabase, não precisa reconectar toda vez

## 🆘 Troubleshooting

### Erro: "Client ID não fornecido"
- Verifique se `NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID` está no `.env.local`

### Erro: "Código não fornecido"
- Certifique-se que a URL de redirect está configurada no Mercado Pago
- Verifique que `NEXT_PUBLIC_URL` está correto

### Erro: "Credenciais do Mercado Pago não configuradas"
- Verifique se `MERCADOPAGO_CLIENT_ID` e `MERCADOPAGO_CLIENT_SECRET` estão no `.env.local`
- Restart o servidor

### Erro: "Tabela não existe"
- Execute o SQL do arquivo `sql/mercadopago-credentials.sql`

## 📚 Referências

- [Mercado Pago OAuth Docs](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integrate-oauth)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
