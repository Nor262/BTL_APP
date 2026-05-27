import { useAuthStore } from './useAuthStore';

// Mock AsyncStorage to avoid native module errors
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
    });
  });

  it('should initialize with default null state values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should set authenticated user and token correctly', () => {
    const mockUser = {
      id: 1,
      username: 'sinhvien01',
      email: 'sinhvien01@ptit.edu.vn',
      full_name: 'Trần Văn Hoàng',
      role: 'borrower' as const,
    };
    const mockToken = 'mock-jwt-token-string';

    useAuthStore.getState().setAuth(mockUser, mockToken);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
  });

  it('should clear authentication state on logout', () => {
    const mockUser = {
      id: 1,
      username: 'sinhvien01',
      email: 'sinhvien01@ptit.edu.vn',
      full_name: 'Trần Văn Hoàng',
      role: 'borrower' as const,
    };
    const mockToken = 'mock-jwt-token';

    // Log in first
    useAuthStore.getState().setAuth(mockUser, mockToken);
    expect(useAuthStore.getState().token).toBe(mockToken);

    // Call logout
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
