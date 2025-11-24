# 💳 Integração AbacatePay - Guia de Setup

## 📋 O que foi implementado

Integração completa com o AbacatePay para cobrar **R$ 10 por número** na rifa:

1. **Campo de Email** - Adicionado ao formulário
2. **Cálculo de Preço** - Exibe total a pagar em tempo real
3. **Link de Pagamento** - Gerado via API do AbacatePay
4. **Webhook de Confirmação** - Salva participação após pagamento confirmado

## 🔑 Configuração Necessária

### 1. Obter Chave de API do AbacatePay

1. Acesse [AbacatePay Dashboard](https://app.abacatepay.com)
2. Faça login ou crie uma conta
3. Vá para **Settings → API Keys**
4. Copie sua chave de API

### 2. Adicionar Variável de Ambiente

Edite `.env.local` e adicione:

```bash
# AbacatePay Configuration
ABACATE_PAY_API_KEY=sua_chave_de_api_aqui
NEXT_PUBLIC_ABACATE_PAY_RETURN_URL=https://seusite.com
NEXT_PUBLIC_ABACATE_PAY_COMPLETION_URL=https://seusite.com/payment/success
```

**Nota:** Substitua `https://seusite.com` pela URL real do seu site.

### 3. Configurar Webhook no AbacatePay

1. No AbacatePay Dashboard, vá para **Webhooks**
2. Clique em **Add Webhook**
3. Configure:
   - **URL**: `https://seusite.com/api/raffle/webhook`
   - **Events**: Selecione `billing.PAID`
   - **Ativo**: Sim

## 💰 Precificação

- **Preço por número**: R$ 10,00
- **Moeda**: BRL (Real Brasileiro)
- **Valor em centavos**: 1000 (conforme API do AbacatePay)

### Exemplos:
- 1 número = R$ 10,00
- 5 números = R$ 50,00
- 10 números = R$ 100,00

## 🔄 Fluxo de Pagamento

```
┌─────────────────────────────────────────────────────┐
│ 1. Usuário preenche formulário e seleciona números │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Clica "Pagar R$ XX.XX" (cálculo automático)    │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. API cria link de pagamento via AbacatePay      │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. Usuário é redirecionado para AbacatePay        │
│    (PIX ou Cartão de Crédito)                     │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. AbacatePay envia webhook confirmando pagamento │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Dados são salvos no Supabase automaticamente    │
│    e números marcados como "Taken" (indisponíveis)│
└─────────────────────────────────────────────────────┘
```

## 📁 Arquivos Criados

### Frontend
- **`components/grand-prize-raffle.tsx`** - Componente atualizado com:
  - Campo de email
  - Exibição de preço total
  - Redirecionamento para pagamento

### Backend
- **`lib/abacatepay.ts`** - Configuração do cliente AbacatePay
- **`app/api/payment/route.ts`** - Endpoint para gerar link de pagamento
- **`app/api/raffle/webhook/route.ts`** - Webhook para confirmar pagamento

### Configuração
- **`.env.local`** - Variáveis de ambiente atualizadas

## 🧪 Testando em Desenvolvimento

### Modo Dev do AbacatePay

1. Use a chave de API de desenvolvimento
2. No link de pagamento, você verá um badge "DEV MODE"
3. Use estes dados de teste:
   - **PIX**: Sempre funciona, basta confirmar
   - **Cartão**: `4111 1111 1111 1111` (Visa teste)

### Testar Webhook Localmente

Para testar o webhook sem publicar para internet:

```bash
# Instale ngrok
# https://ngrok.com

# Em outro terminal, rode:
ngrok http 3000

# Configure o webhook com a URL do ngrok:
# https://xxxxx-xx-xxx-xxx.ngrok.io/api/raffle/webhook
```

## 🚀 Ir para Produção

1. **Mudar para chave de produção** no AbacatePay
2. **Atualizar `.env.local`** com URL de produção
3. **Ativar validação de assinatura** no webhook (descomente em `webhook/route.ts`)
4. **Testar fluxo completo** antes de lançar

## 📊 Monitoramento

- **Dashboard AbacatePay**: Veja todos os pagamentos e status
- **Supabase**: Verifique tabela `numero` para confirmar registros

## ❓ Dúvidas?

- Docs AbacatePay: https://docs.abacatepay.com
- Email suporte: ajuda@abacatepay.com

## ⚠️ Segurança (TODO em Produção)

- [ ] Validar assinatura do webhook
- [ ] Usar variáveis secretas em `.env` (não público)
- [ ] HTTPS obrigatório em produção
- [ ] Rate limiting na API de pagamento
- [ ] Logs e auditoria de transações
