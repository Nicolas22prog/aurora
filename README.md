# 🎰 Rifa do Miguel (Grand Prize Raffle)

Uma aplicação de rifa online para arrecadar contribuições e sortear prêmios. A aplicação permite que usuários selecionem números, façam o pagamento (PIX/cartão) e tenham a participação salva no banco apenas após confirmação do pagamento.

Status: ✅ Implementado com suporte a pagamentos e persistência em Supabase

---

## 🧭 Visão Geral

- Frontend em Next.js (app router)
- Banco de dados: Supabase (Postgres)
- Integração de pagamentos: AbacatePay (documentação incluída) e suporte a Mercado Pago (implementado em `lib/mercadopago.ts`)
- Preço por número: R$ 10,00

## 📌 Principais Recursos

- Seleção interativa de números (1–300)
- Números já comprados aparecem como indisponíveis
- Validação e mascaramento de telefone no formato brasileiro `(XX) XXXX-XXXX`
- Limite de caracteres no Nome Completo (100 caracteres)
- Geração de link de pagamento via API
- Webhook para confirmação e persistência de pagamento
- API endpoints para status, reprocessamento e fallback de salvamento

---

## 📁 Estrutura do Projeto (resumo)

Principais arquivos/folders modificados ou relevantes:

- `app/` - páginas do Next.js (inclui `page.tsx` e `success`)
- `components/grand-prize-raffle.tsx` - Componente principal do formulário/seleção de números (validações, máscara de telefone, limite de caracteres do nome)
- `components/raffle-confirmation.tsx` - Tela de sucesso após pagamento
- `lib/supabase.ts` - Cliente e funções utilitárias do Supabase
- `lib/mercadopago.ts` - Integração com Mercado Pago (já implementada)
- `lib/abacatepay.ts` - Placeholder para AbacatePay (documentação e configuração em `ABACATEPAY_SETUP.md`)
- `app/api/` - rotas serverless
	 - `/api/payment` - cria link de pagamento
	 - `/api/payment/webhook` - recebe notificações de pagamento (Mercado Pago)
	 - `/api/payment/status` - status de pagamentos
	 - `/api/payment/reprocess` - reprocessa e salva pagamentos pendentes
	 - `/api/payment/ensure` - garantia de criação de registro em fallback
	 - `/api/raffle` - endpoint principal de rifa (validação e persistência via Supabase)
	 - `/api/entry` - busca entradas por telefone e número
- `sql/numero-table.sql` - script SQL para a tabela `numero`
  
---

## 🔧 Requisitos & Configuração

1. Tenha Node.js (>=18) e npm/yarn/pnpm instalado.
2. Clone o repositório e instale dependências:

```bash
git clone <repo>
cd rifa-miguel-main
npm install

# Inicie o servidor
npm run dev
```

### Variáveis de ambiente (exemplo `.env.local`)

```bash
# Supabase - necessárias
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> # recomendado para tarefas administrativas

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=<mercadopago_token>

# AbacatePay (se usar)
ABACATE_PAY_API_KEY=<abacatepay_key>
NEXT_PUBLIC_ABACATE_PAY_RETURN_URL=https://seu-site.com
NEXT_PUBLIC_ABACATE_PAY_COMPLETION_URL=https://seu-site.com/payment/success

# URL base usada para webhooks/retornos
NEXT_PUBLIC_URL=http://localhost:3000
```

> Observação: Não comite `.env` em repositórios públicos.

---

## 🗄️ Banco de Dados (Supabase)

Tabela principal: `numero` (arquivo de exemplo: `sql/numero-table.sql`)

Esquema:

```sql
CREATE TABLE IF NOT EXISTS numero (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	nome VARCHAR(255) NOT NULL,
	telefone VARCHAR(20) NOT NULL,
	numero INTEGER[] NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

- Observação crítica: A coluna é `numero` (singular). Ver `CORRECAO_COLUNA_NUMERO.md` se sua tabela foi criada com `numeros`.
- Caso RLS (Row Level Security) esteja ativo, configurar políticas conforme `SUPABASE_RLS.md` ou desabilitar RLS para desenvolvimento.

---

## 🚀 Como Funciona (Fluxo)

1. Usuário acessa a página e escolhe números (grid 1–300).
2. Usuário preenche Nome e Telefone (Nome limitado a 100 caracteres, telefone formatado automaticamente).
3. O preço é calculado dinamicamente (R$ 10 × quantidade de números).
4. O frontend chama `/api/payment` para criar o link de pagamento (Mercado Pago/AbacatePay).
5. Usuário é redirecionado para o provedor de pagamento.
6. Após pagamento confirmado pelo provedor, o webhook salva os dados no Supabase e marca os números como indisponíveis.
7. Se webhook falhar, endpoints `reprocess` e `ensure` tentam reconciliar pagamentos e salvar a participação.

---

## 🔐 Validações & UX importantes

- Nome: **máximo 100 caracteres** (atributo `maxLength` e contador mostrados no formulário).
- Telefone: aceito como apenas dígitos; o input formata automaticamente para `(XX) XXXX-XXXX` e limita a 11 dígitos. Também há validação básica no servidor para garantir 10–13 dígitos (com ou sem código do país).
- Números: não é possível selecionar números já comprados (renderizados como `disabled`).
- Botão de envio fica desabilitado caso faltem campos obrigatórios ou esteja no processo de envio.

---

## ⚙️ Endpoints e roteamento

- `POST /api/payment` → Cria link de pagamento e retorna `init_point` ou URL de pagamento.
- `POST /api/payment/webhook` → Recebe notificações de pagamento do provedor e salva no banco.
- `GET  /api/payment/status` → Checa status do pagamento em Mercado Pago.
- `POST /api/payment/reprocess` → Reprocessa pagamento para salvar entradas perdidas.
- `POST /api/payment/ensure` → Garante que a participação exista (fallback utilitário usado no success page).
- `POST /api/raffle` → Endpoint para salvar participações (valida nome/telefone/números).
- `GET  /api/entry?phone=<phone>&number=<number>` → Busca entradas por telefone e número.

---

## 🧪 Testes e Desenvolvimento Local

### Executando localmente:

```bash
npm run dev
```

### Testando Webhook localmente (ngrok):

```bash
# In another terminal
ngrok http 3000
# Configure provider to send webhook to https://xxxxxx.ngrok.io/api/payment/webhook
```

### Dicas para testes:
- Use `MERCADOPAGO_ACCESS_TOKEN` dev token for Mercado Pago or AbacatePay test keys.
- Use `app/success` redirect to check if the fallback `ensure` is triggered.

---

## 📝 Observações Técnicas & Próximos Passos

- `lib/abacatepay.ts` existe como placeholder (documentação em `ABACATEPAY_SETUP.md`). A integração principal e testada atual é com Mercado Pago (`lib/mercadopago.ts`).
- Security TODOs: validar assinatura do webhook, habilitar HTTPS, rate limit nas rotas.
- Melhorias sugeridas: adicionar autenticação, painel administrativo, histórico, e testes E2E.

---

## 📚 Referências & Documentação Adicional

- `ABACATEPAY_SETUP.md` - guia AbacatePay
- `SUPABASE_SETUP.md` - configurar Supabase
- `SUPABASE_RLS.md` - resolver RLS
- `CORRECAO_COLUNA_NUMERO.md` - correções no schema
- `TECHNICAL_SUMMARY.md` - resumo das integrações e arquitetura

---

Se quiser que eu adicione instruções de deploy específicas (Vercel, Railway, ou outro), ou exemplos de comandos para testes automatizados, me avise e eu incluo. ✨
