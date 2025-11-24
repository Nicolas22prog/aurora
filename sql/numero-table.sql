-- Estrutura correta da tabela 'numero' para o projeto de Rifa

CREATE TABLE IF NOT EXISTS numero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  numero INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_numero_nome ON numero(nome);
CREATE INDEX IF NOT EXISTS idx_numero_telefone ON numero(telefone);

-- IMPORTANTE: A coluna 'numero' deve ser um array de inteiros (INTEGER[])
-- Esta é a coluna que o componente lê para marcar os números como "já selecionados"

-- Exemplo de INSERT:
INSERT INTO numero (nome, telefone, numero) 
VALUES 
  ('João Silva', '(11) 98765-4321', ARRAY[5, 12, 25, 42, 89]),
  ('Maria Santos', '(11) 91234-5678', ARRAY[1, 10, 20, 30, 50, 100]);

-- IMPORTANTE: Desabilitar RLS para permitir inserções públicas
-- Se o RLS está habilitado, execute:
ALTER TABLE numero DISABLE ROW LEVEL SECURITY;

-- OU se preferir manter o RLS habilitado, recrie as políticas corretamente:
-- ALTER TABLE numero ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Allow public insert" ON numero;
-- DROP POLICY IF EXISTS "Allow public select" ON numero;
-- DROP POLICY IF EXISTS "Allow public update" ON numero;
-- 
-- CREATE POLICY "Allow public insert" ON numero
--   FOR INSERT
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Allow public select" ON numero
--   FOR SELECT
--   USING (true);
-- 
-- CREATE POLICY "Allow public update" ON numero
--   FOR UPDATE
--   USING (true)
--   WITH CHECK (true);
