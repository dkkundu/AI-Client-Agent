import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import { MongoClient } from 'mongodb';

export type DbType = 'sqlite' | 'mysql' | 'postgres' | 'mongodb';

export interface DbConfig {
  type: DbType;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

class DatabaseManager {
  private activeConfig: DbConfig | null = null;
  private connection: any = null;

  async testConnection(config: DbConfig): Promise<boolean> {
    try {
      if (config.type === 'sqlite') {
        try {
          const db = new Database(config.database || ':memory:');
          db.close();
          return true;
        } catch {
          return false;
        }
      } else if (config.type === 'mysql') {
        const conn = await mysql.createConnection({
          host: config.host,
          port: config.port ? Number(config.port) : 3306,
          user: config.user,
          password: config.password,
          database: config.database
        });
        await conn.ping();
        await conn.end();
        return true;
      } else if (config.type === 'postgres') {
        const pool = new PgPool({
          host: config.host,
          port: config.port ? Number(config.port) : 5432,
          user: config.user,
          password: config.password,
          database: config.database
        });
        const client = await pool.connect();
        client.release();
        await pool.end();
        return true;
      } else if (config.type === 'mongodb') {
        const url = config.user 
          ? `mongodb://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password || '')}@${config.host}:${config.port || 27017}/${config.database}?authSource=admin`
          : `mongodb://${config.host}:${config.port || 27017}/${config.database}`;
        const client = new MongoClient(url);
        await client.connect();
        await client.db().command({ ping: 1 });
        await client.close();
        return true;
      }
      return false;
    } catch (e: any) {
      console.error(`DB test failed (${config.type}):`, e.message);
      return false;
    }
  }

  async connect(config: DbConfig): Promise<boolean> {
    // Close existing connection if any
    await this.disconnect();
    
    try {
      if (config.type === 'sqlite') {
        this.connection = new Database(config.database || 'llm_client.sqlite');
        this.activeConfig = config;
        return true;
      } else if (config.type === 'mysql') {
        this.connection = await mysql.createPool({
          host: config.host,
          port: config.port ? Number(config.port) : 3306,
          user: config.user,
          password: config.password,
          database: config.database
        });
      } else if (config.type === 'postgres') {
        const pool = new PgPool({
          host: config.host,
          port: config.port ? Number(config.port) : 5432,
          user: config.user,
          password: config.password,
          database: config.database
        });
        // Test pool
        const client = await pool.connect();
        client.release();
        this.connection = pool;
      } else if (config.type === 'mongodb') {
        const url = config.user 
          ? `mongodb://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password || '')}@${config.host}:${config.port || 27017}/${config.database}?authSource=admin`
          : `mongodb://${config.host}:${config.port || 27017}/${config.database}`;
        const client = new MongoClient(url);
        await client.connect();
        this.connection = client;
      }
      this.activeConfig = config;
      return true;
    } catch (e: any) {
      console.error(`DB connection failed (${config.type}):`, e.message);
      this.connection = null;
      this.activeConfig = null;
      return false;
    }
  }

  async disconnect() {
    if (!this.connection) return;
    try {
      if (this.activeConfig?.type === 'sqlite') {
        this.connection.close();
      } else if (this.activeConfig?.type === 'mysql') {
        await this.connection.end();
      } else if (this.activeConfig?.type === 'postgres') {
        await this.connection.end();
      } else if (this.activeConfig?.type === 'mongodb') {
        await this.connection.close();
      }
    } catch (e) {
      console.error('Error closing DB connection:', e);
    }
    this.connection = null;
    this.activeConfig = null;
  }

  getStatus() {
    return {
      connected: this.connection !== null,
      config: this.activeConfig
    };
  }
}

export const dbManager = new DatabaseManager();
