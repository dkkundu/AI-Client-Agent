import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AppModule = 'coding' | 'video' | 'knowledge' | 'settings';

interface UIState {
  activeModule: AppModule;
  sidebarOpen: boolean;
  selectedFile: string | null;
  workspacePath: string;
  fileRefreshKey: number;
  setActiveModule: (module: AppModule) => void;
  toggleSidebar: () => void;
  setSelectedFile: (file: string | null) => void;
  setWorkspacePath: (path: string) => void;
  triggerFileRefresh: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeModule: 'coding',
      sidebarOpen: true,
      selectedFile: null,
      workspacePath: '',
      fileRefreshKey: 0,
      setActiveModule: (module) => set({ activeModule: module }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSelectedFile: (file) => set({ selectedFile: file }),
      setWorkspacePath: (path) => set({ workspacePath: path }),
      triggerFileRefresh: () => set((state) => ({ fileRefreshKey: state.fileRefreshKey + 1 })),
    }),
    {
      name: 'llm-ui-store',
      partialize: (state) => ({ workspacePath: state.workspacePath }),
    }
  )
);
