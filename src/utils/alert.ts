import { useAlertStore } from '../store/useAlertStore';

export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: Array<{ text?: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
    options?: any
  ) => {
    const showCancel = buttons && buttons.length > 1;
    
    // Determine the type based on keyword in title/message
    let type: 'success' | 'error' | 'warning' | 'info' = 'info';
    const textToCheck = `${title} ${message || ''}`.toLowerCase();
    
    if (textToCheck.includes('thành công') || textToCheck.includes('hoàn thành') || textToCheck.includes('đồng ý')) {
      type = 'success';
    } else if (textToCheck.includes('lỗi') || textToCheck.includes('thất bại') || textToCheck.includes('hủy') || textToCheck.includes('xóa')) {
      type = 'error';
    } else if (textToCheck.includes('xác nhận') || textToCheck.includes('cảnh báo') || textToCheck.includes('khóa')) {
      type = 'warning';
    }

    // Find the non-cancel action button to run on confirm
    const confirmBtn = buttons?.find(b => b.style !== 'cancel') || buttons?.[0];

    useAlertStore.getState().showAlert({
      type,
      title,
      message: message || '',
      showCancel,
      onConfirm: confirmBtn?.onPress,
    });
  }
};
