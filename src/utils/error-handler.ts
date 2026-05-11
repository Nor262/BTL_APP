import { Alert } from 'react-native';

export const handleApiError = (error: any, defaultTitle: string = 'Đã xảy ra lỗi') => {
  console.error(`[API Error] ${defaultTitle}:`, error);

  let message = 'Có lỗi xảy ra, vui lòng thử lại sau.';

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const data = error.response.data;
    if (data?.message) {
      message = Array.isArray(data.message) ? data.message.join('\n') : data.message;
    }
  } else if (error.request) {
    // The request was made but no response was received
    message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  } else {
    // Something happened in setting up the request that triggered an Error
    message = error.message || message;
  }

  Alert.alert(defaultTitle, message);
};
