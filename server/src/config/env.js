import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/devcollab?schema=public',
  sessionSecret: process.env.SESSION_SECRET || 'devcollab_super_secure_random_session_secret_key_prod_2026_98317498',
  cookieSecret: process.env.COOKIE_SECRET || 'devcollab_super_secure_cookie_signer_secret_key_prod_2026_19283746',
  devAdmin: {
    email: process.env.DEV_ADMIN_EMAIL || 'admin@devcollab.io',
    username: process.env.DEV_ADMIN_USERNAME || 'admin',
    password: process.env.DEV_ADMIN_PASSWORD || 'DevCollabAdmin2026!',
    name: process.env.DEV_ADMIN_NAME || 'DevCollab Administrator'
  },
  sessionDurationDays: 14
};
