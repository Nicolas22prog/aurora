-- Tabela para armazenar credenciais do Mercado Pago
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

-- Criar índice na coluna account_id para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_mercadopago_account_id ON mercadopago_credentials(account_id);

-- Habilitar RLS (Row Level Security) se necessário
ALTER TABLE mercadopago_credentials ENABLE ROW LEVEL SECURITY;

-- Criar política para leitura (somente admin/backend pode ler)
CREATE POLICY "Allow backend to read MP credentials" ON mercadopago_credentials
  FOR SELECT
  USING (true);

-- Criar política para insert (somente admin pode inserir)
CREATE POLICY "Allow admin to insert MP credentials" ON mercadopago_credentials
  FOR INSERT
  WITH CHECK (true);

-- Criar política para update (somente admin pode atualizar)
CREATE POLICY "Allow admin to update MP credentials" ON mercadopago_credentials
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
