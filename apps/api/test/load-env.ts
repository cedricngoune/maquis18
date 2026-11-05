import { config } from 'dotenv';
import { resolve } from 'node:path';

// override: true → .env.test wins over values already loaded from .env
config({ path: resolve(__dirname, '../.env.test'), override: true });
