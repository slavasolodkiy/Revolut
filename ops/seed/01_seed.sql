-- NovaPay development seed data
-- Password for demo user: demo1234 (SHA-256 of "demo1234salt_novapay")

INSERT INTO users (id, email, first_name, last_name, country_code, account_type, password_hash, kyc_status, onboarding_status)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'demo@novapay.example.com',
  'Alex',
  'Morgan',
  'GB',
  'personal',
  'ebef857b8f25d799ab7cba43df69a3421ae58823eaf7d37e4f1ff7a2ac9a3f18',
  'approved',
  'completed'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (id, user_id, currency, balance, available_balance, iban, swift, account_type, label, color, is_default)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'GBP', 4250.75, 4250.75, 'GB29NOVA12345601234567', 'NOVAGB2L', 'current', 'Main Account', '#6366f1', true),
  ('a0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'EUR', 1820.40, 1820.40, 'GB29NOVA12345601234568', 'NOVAGB2L', 'current', 'Euro Account', '#8b5cf6', false),
  ('a0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'USD', 932.00, 932.00, 'GB29NOVA12345601234569', 'NOVAGB2L', 'current', 'Dollar Account', '#06b6d4', false),
  ('a0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'GBP', 5000.00, 5000.00, NULL, NULL, 'savings', 'Emergency Fund', '#10b981', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (account_id, type, amount, currency, description, merchant_name, merchant_category, status, counterparty_name)
SELECT 'a0000001-0000-0000-0000-000000000001', * FROM (VALUES
  ('credit'::transaction_type, 3200.00, 'GBP', 'Monthly salary', 'Acme Corp Ltd', 'Income', 'completed'::transaction_status, 'Acme Corp Ltd'),
  ('card_payment'::transaction_type, -42.50, 'GBP', 'Grocery shopping', 'Tesco Metro', 'Food & Dining', 'completed'::transaction_status, NULL),
  ('card_payment'::transaction_type, -12.99, 'GBP', 'Monthly subscription', 'Netflix', 'Entertainment', 'completed'::transaction_status, NULL),
  ('card_payment'::transaction_type, -28.75, 'GBP', 'Dining out', 'Nandos', 'Food & Dining', 'completed'::transaction_status, NULL),
  ('transfer'::transaction_type, -200.00, 'GBP', 'Transfer to savings', NULL, NULL, 'completed'::transaction_status, 'Emergency Fund'),
  ('card_payment'::transaction_type, -35.00, 'GBP', 'Petrol', 'BP Garage', 'Transport', 'completed'::transaction_status, NULL),
  ('card_payment'::transaction_type, -89.00, 'GBP', 'Online shopping', 'Amazon', 'Shopping', 'completed'::transaction_status, NULL),
  ('topup'::transaction_type, 500.00, 'GBP', 'Top-up from bank', NULL, NULL, 'completed'::transaction_status, NULL)
) AS t (type, amount, currency, description, merchant_name, merchant_category, status, counterparty_name);

INSERT INTO notifications (user_id, type, title, body, is_read)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'payment_received', 'Payment received', 'You received GBP 3,200.00 from Acme Corp Ltd', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'kyc_update', 'Identity verified', 'Your identity verification is complete.', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'system', 'Welcome to NovaPay', 'Your account is ready.', true)
ON CONFLICT DO NOTHING;
