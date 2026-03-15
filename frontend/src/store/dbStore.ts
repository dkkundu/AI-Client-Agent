import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DbType = 'sqlite' | 'mysql' | 'postgres' | 'mongodb';

export interface DbConfig {
  type: DbType;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

interface DbState {
  config: DbConfig;
  isConnected: boolean;
  isChecking: boolean;
  setConfig: (config: DbConfig) => void;
  setIsConnected: (connected: boolean) => void;
  checkConnectionStatus: () => Promise<boolean>;
  connect: (config: DbConfig) => Promise<boolean>;
  testConnection: (config: DbConfig) => Promise<boolean>;
}

export const useDbStore = create<DbState>()(
  persist(
    (set) => ({
      config: { type: 'sqlite', database: 'llm_client.sqlite' },
      isConnected: false,
      isChecking: true,
      
      setConfig: (config) => set({ config }),
      setIsConnected: (isConnected) => set({ isConnected }),
      
      checkConnectionStatus: async () => {
        set({ isChecking: true });
        try {
          const res = await fetch('http://localhost:3001/api/db/status');
          const data = await res.json();
          set({ isConnected: data.connected, isChecking: false });
          return data.connected;
        } catch (e) {
          set({ isConnected: false, isChecking: false });
          return false;
        }
      },

      connect: async (config) => {
        try {
          const res = await fetch('http://localhost:3001/api/db/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          });
          if (res.ok) {
            await res.json();
            set({ config, isConnected: true });
            return true;
          }
        } catch (e) {
          console.error('Failed to connect to DB', e);
        }
        return false;
      },

      testConnection: async (config) => {
        try {
          const res = await fetch('http://localhost:3001/api/db/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          });
          return res.ok;
        } catch (e) {
          return false;
        }
      }
    }),
    {
      name: 'llm-client-db',
      partialize: (state) => ({ config: state.config }), // Only persist the config
    }
  )
);
