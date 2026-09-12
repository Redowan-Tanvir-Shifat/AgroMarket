import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isRemoteDb = process.env.DB_HOST &&
  process.env.DB_HOST !== 'localhost' &&
  process.env.DB_HOST !== '127.0.0.1';

const useSSL = process.env.DB_SSL === 'true' ||
  process.env.DB_SSL === '1' ||
  isRemoteDb;

// Create connection pool targeting agromarket DB
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'agromarket',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined
});

export default pool;
