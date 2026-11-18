import 'dotenv/config';

// Os testes nunca tocam no banco de desenvolvimento.
if (!process.env.TEST_DATABASE_URL) throw new Error('defina TEST_DATABASE_URL no .env');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = 'segredo-de-teste';
