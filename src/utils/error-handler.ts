import { useAlertStore } from '@/store/useAlertStore';

export const handleApiError = (error: any, defaultTitle: string = 'Đã xảy ra lỗi') => {
  console.error(`[API Error] ${defaultTitle}:`, error);

  let message = 'Có lỗi xảy ra, vui lòng thử lại sau.';

  if (error.response) {
    const data = error.response.data;
    if (data?.message) {
      message = Array.isArray(data.message) ? data.message.join('\n') : data.message;
    }
  } else if (error.request) {
    message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  } else {
    message = error.message || message;
  }

  useAlertStore.getState().showAlert({
    type: 'error',
    title: defaultTitle,
    message: message,
  });
};
