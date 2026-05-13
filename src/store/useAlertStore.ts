import { create } from 'zustand';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  showAlert: (config: { type: AlertType; title: string; message: string; onConfirm?: () => void; showCancel?: boolean }) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  type: 'info',
  title: '',
  message: '',
  onConfirm: undefined,
  showCancel: false,
  showAlert: (config) => set({ visible: true, ...config }),
  hideAlert: () => set({ visible: false }),
}));
