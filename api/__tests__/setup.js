/**
 * Jest Setup - Configuração global para testes
 */

require('dotenv').config({ path: '.env.test' });

// Configuração de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ambio_test';

// Silenciar logs durante testes (opcional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// Timeout global
jest.setTimeout(30000);

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});
