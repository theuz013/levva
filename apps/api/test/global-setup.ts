import { execSync } from 'child_process';
import 'dotenv/config';

export default function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('defina TEST_DATABASE_URL no .env');
  if (url === process.env.DATABASE_URL) throw new Error('TEST_DATABASE_URL não pode ser o banco de desenvolvimento');
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'ignore',
  });
}
