import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detected local IP for this machine is 192.168.55.106
const expoHost = Constants.expoGoConfig?.debuggerHost?.split(':')[0]
  ?? Constants.expoConfig?.hostUri?.split(':')[0]
  ?? '192.168.55.106'; // Hardcoded fallback for the current environment

const DEV_API_URL = Platform.select({
  ios: `http://${expoHost}:3000/v1`,
  android: `http://${expoHost}:3000/v1`,
  default: `http://localhost:3000/v1`,
});

console.log('Backend API URL:', DEV_API_URL);

export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || DEV_API_URL,
  PRIMARY_COLOR: '#CC0D00',
};
