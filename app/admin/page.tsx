'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface MercadoPagoCredentials {
  id: string;
  account_id: string;
  account_email: string;
  access_token: string;
  created_at: string;
  updated_at: string;
}

interface SaleRecord {
  id: string;
  nome: string;
  telefone: string;
  numero: number[];
  created_at: string;
  total: number;
}

interface SalesData {
  latestSales: SaleRecord[];
  totalRevenue: number;
  totalSales: number;
  averageTicket: number;
}

export default function AdminPage() {
  const [credentials, setCredentials] = useState<MercadoPagoCredentials | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Buscar credenciais salvas
    fetchCredentials();
    // Buscar dados de vendas
    fetchSalesData();

    // Verificar se voltou de OAuth (callback)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/admin/mercadopago/credentials');
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      }
    } catch (error) {
      console.error('Erro ao buscar credenciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    try {
      const response = await fetch('/api/admin/mercadopago/sales');
      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de vendas:', error);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setConnecting(true);
      console.log('OAuth Callback - Started with code:', code.substring(0, 20) + '...');
      
      const response = await fetch('/api/auth/mercadopago/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          state,
        }),
      });

      console.log('OAuth Callback - Response Status:', response.status);
      const responseText = await response.text();
      console.log('OAuth Callback - Response:', responseText);

      if (!response.ok) {
        const error = JSON.parse(responseText);
        console.error('OAuth Callback - Error response:', error);
        throw new Error(error.message || 'Erro ao conectar com Mercado Pago');
      }

      const data = JSON.parse(responseText);
      console.log('OAuth Callback - Success, credentials received');
      
      setCredentials(data);
      setMessage({ type: 'success', text: 'Conta do Mercado Pago conectada com sucesso!' });
      fetchSalesData(); // Recarregar dados de vendas

      // Limpar URL
      window.history.replaceState({}, document.title, '/admin');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('OAuth Callback - Exception:', error);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      // Redirecionar para OAuth do Mercado Pago
      const clientId = process.env.NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID;
      const redirectUri = `${window.location.origin}/admin`;
      const state = Math.random().toString(36).substring(7);

      console.log('=== handleConnect Debug ===');
      console.log('window.location.origin:', window.location.origin);
      console.log('redirectUri:', redirectUri);
      console.log('Client ID:', clientId);
      console.log('State:', state);

      const oauthUrl = new URL('https://auth.mercadopago.com.br/authorization');
      oauthUrl.searchParams.append('client_id', clientId || '');
      oauthUrl.searchParams.append('response_type', 'code');
      oauthUrl.searchParams.append('platform_id', 'MP');
      oauthUrl.searchParams.append('redirect_uri', redirectUri);
      oauthUrl.searchParams.append('state', state);

      const fullUrl = oauthUrl.toString();
      console.log('Full OAuth URL:', fullUrl);
      console.log('=== End Debug ===');
      
      window.location.href = fullUrl;
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      setMessage({ type: 'error', text: 'Erro ao gerar URL de autenticação' });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar a conta do Mercado Pago?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/mercadopago/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setCredentials(null);
        setSalesData(null);
        setMessage({ type: 'success', text: 'Conta do Mercado Pago desconectada' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Erro ao desconectar' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Painel de Admin</h1>
          <p className="text-slate-400 mb-8">Gerenciar integração com Mercado Pago</p>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-900 text-green-100 border border-green-700'
                  : 'bg-red-900 text-red-100 border border-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="border-t border-slate-700 pt-8">
            <h2 className="text-xl font-semibold text-white mb-6">Integração Mercado Pago</h2>

            {credentials ? (
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-300 text-sm mb-1">ID da Conta</p>
                  <p className="text-white font-mono text-lg">{credentials.account_id}</p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-300 text-sm mb-1">Email da Conta</p>
                  <p className="text-white">{credentials.account_email}</p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-300 text-sm mb-1">Conectado em</p>
                  <p className="text-white">
                    {new Date(credentials.created_at).toLocaleDateString('pt-BR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                <div className="bg-green-900 border border-green-700 rounded-lg p-4 mt-6">
                  <p className="text-green-100 text-sm font-semibold">✓ Status: Conectado</p>
                  <p className="text-green-200 text-xs mt-1">
                    Pagamentos serão processados com a conta conectada
                  </p>
                </div>

                <Button
                  onClick={handleDisconnect}
                  className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white"
                >
                  Desconectar Mercado Pago
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-6 text-center">
                  <p className="text-slate-300 mb-4">
                    Nenhuma conta do Mercado Pago conectada. Clique no botão abaixo para conectar sua
                    conta.
                  </p>
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
                >
                  {connecting ? 'Conectando...' : 'Conectar Mercado Pago via OAuth'}
                </Button>

                <p className="text-slate-400 text-xs mt-4">
                  Você será redirecionado para o Mercado Pago para autenticar sua conta. Após a
                  autenticação, você será retornado para esta página com suas credenciais salvas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Vendas */}
        {salesData && (
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Resumo de Vendas</h2>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6">
                <p className="text-blue-100 text-sm font-semibold mb-2">Total Arrecadado</p>
                <p className="text-white text-3xl font-bold">
                  R$ {salesData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6">
                <p className="text-green-100 text-sm font-semibold mb-2">Total de Compras</p>
                <p className="text-white text-3xl font-bold">{salesData.totalSales}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6">
                <p className="text-purple-100 text-sm font-semibold mb-2">Ticket Médio</p>
                <p className="text-white text-3xl font-bold">
                  R$ {salesData.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Tabela de Últimas Vendas */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Últimas 10 Compras</h3>
              {salesData.latestSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-700 border-b border-slate-600">
                        <th className="px-4 py-3 text-left text-slate-300 font-semibold">Nome</th>
                        <th className="px-4 py-3 text-left text-slate-300 font-semibold">Telefone</th>
                        <th className="px-4 py-3 text-center text-slate-300 font-semibold">Números</th>
                        <th className="px-4 py-3 text-right text-slate-300 font-semibold">Total</th>
                        <th className="px-4 py-3 text-left text-slate-300 font-semibold">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.latestSales.map((sale, index) => (
                        <tr
                          key={sale.id}
                          className={`border-b border-slate-700 ${
                            index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700/50'
                          } hover:bg-slate-700 transition-colors`}
                        >
                          <td className="px-4 py-3 text-white font-medium">{sale.nome}</td>
                          <td className="px-4 py-3 text-slate-300">{sale.telefone}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-slate-700 text-slate-100 px-2 py-1 rounded text-xs font-semibold">
                              {sale.numero.length}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-green-400 font-semibold">
                            R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-xs">
                            {new Date(sale.created_at).toLocaleDateString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-700 rounded-lg p-6 text-center">
                  <p className="text-slate-300">Nenhuma compra registrada ainda.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
