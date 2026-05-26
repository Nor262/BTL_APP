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
  // Reset onConfirm/showCancel mặc định trước khi áp config mới,
  // tránh dính onConfirm cũ (vd logout) khi alert mới không truyền onConfirm.
  showAlert: (config) => set({ visible: true, onConfirm: undefined, showCancel: false, ...config }),
  hideAlert: () => set({ visible: false }),
}));
