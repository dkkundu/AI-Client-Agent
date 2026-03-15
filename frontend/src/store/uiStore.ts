import { create } from 'zustand';

type AppModule = 'coding' | 'video' | 'knowledge' | 'settings';

interface UIState {
  activeModule: AppModule;
  sidebarOpen: boolean;
  selectedFile: string | null;
  setActiveModule: (module: AppModule) => void;
  toggleSidebar: () => void;
  setSelectedFile: (file: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: 'coding',
  sidebarOpen: true,
  selectedFile: null,
  setActiveModule: (module) => set({ activeModule: module }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSelectedFile: (file) => set({ selectedFile: file }),
}));
