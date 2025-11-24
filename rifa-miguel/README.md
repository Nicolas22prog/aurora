# 🎰 Grand Prize Raffle

Sistema de rifa online integrado com Supabase e AbacatePay.

- ✅ Seleção de números disponíveis
- ✅ Pagamento via PIX e Cartão (AbacatePay)
- ✅ Sincronização em tempo real com banco de dados
- ✅ Webhook para confirmação de pagamento

## 📖 Documentação

- **[ABACATEPAY_SETUP.md](./ABACATEPAY_SETUP.md)** - Setup de pagamentos (R$ 10 por número)
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Configuração do banco de dados
- **[SUPABASE_RLS.md](./SUPABASE_RLS.md)** - Resolução de problemas com RLS
- **[CORRECAO_COLUNA_NUMERO.md](./CORRECAO_COLUNA_NUMERO.md)** - Correção de nomes de coluna

## 🚀 Começando

Primeiro, execute o servidor de desenvolvimento:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
