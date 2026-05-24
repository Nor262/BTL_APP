import { handleApiError } from './error-handler';
import { useAlertStore } from '@/store/useAlertStore';

// Mock useAlertStore to verify state change triggers
jest.mock('@/store/useAlertStore', () => {
  const mockShowAlert = jest.fn();
  return {
    useAlertStore: {
      getState: () => ({
        showAlert: mockShowAlert,
      }),
    },
  };
});

describe('handleApiError', () => {
  let mockShowAlert: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockShowAlert = useAlertStore.getState().showAlert as jest.Mock;
  });

  it('should parse an Axios-like API validation error array response correctly', () => {
    const mockError = {
      response: {
        data: {
          message: ['Field is required', 'Must be a valid email'],
        },
      },
    };

    handleApiError(mockError, 'Đăng nhập thất bại');

    expect(mockShowAlert).toHaveBeenCalledTimes(1);
    expect(mockShowAlert).toHaveBeenCalledWith({
      type: 'error',
      title: 'Đăng nhập thất bại',
      message: 'Field is required\nMust be a valid email',
    });
  });

  it('should parse a single string error response correctly', () => {
    const mockError = {
      response: {
        data: {
          message: 'Tài khoản đã bị vô hiệu hóa',
        },
      },
    };

    handleApiError(mockError, 'Xác thực không hợp lệ');

    expect(mockShowAlert).toHaveBeenCalledTimes(1);
    expect(mockShowAlert).toHaveBeenCalledWith({
      type: 'error',
      title: 'Xác thực không hợp lệ',
      message: 'Tài khoản đã bị vô hiệu hóa',
    });
  });

  it('should fallback to network connection message when no response is received', () => {
    const mockError = {
      request: {},
    };

    handleApiError(mockError);

    expect(mockShowAlert).toHaveBeenCalledTimes(1);
    expect(mockShowAlert).toHaveBeenCalledWith({
      type: 'error',
      title: 'Đã xảy ra lỗi',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
    });
  });

  it('should fallback to error message property or default message if generic error', () => {
    const mockError = new Error('Generic internal error occured');

    handleApiError(mockError);

    expect(mockShowAlert).toHaveBeenCalledTimes(1);
    expect(mockShowAlert).toHaveBeenCalledWith({
      type: 'error',
      title: 'Đã xảy ra lỗi',
      message: 'Generic internal error occured',
    });
  });
});
