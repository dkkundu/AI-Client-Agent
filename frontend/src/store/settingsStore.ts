import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  ollamaUrl: string;
  defaultModel: string;
  workspacePath: string;
  videoApiUrl: string;
  setOllamaUrl: (url: string) => void;
  setDefaultModel: (model: string) => void;
  setWorkspacePath: (path: string) => void;
  setVideoApiUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ollamaUrl: 'http://localhost:11434',
      defaultModel: 'llama3',
      workspacePath: '/workspace',
      videoApiUrl: '',
      setOllamaUrl: (url) => set({ ollamaUrl: url }),
      setDefaultModel: (model) => set({ defaultModel: model }),
      setWorkspacePath: (path) => set({ workspacePath: path }),
      setVideoApiUrl: (url) => set({ videoApiUrl: url }),
    }),
    {
      name: 'llm-client-settings',
    }
  )
);
