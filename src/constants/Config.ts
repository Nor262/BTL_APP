import { Platform } from 'react-native';
import Constants from 'expo-constants';

const expoHost = Constants.expoGoConfig?.debuggerHost?.split(':')[0]
  ?? Constants.expoConfig?.hostUri?.split(':')[0]
  ?? '192.168.1.26'; // Fallback: IP LAN máy dev hiện tại

const DEV_API_URL = Platform.select({
  ios: `http://${isExpoTunnel ? FALLBACK_IP : expoHost}:3000/v1`,
  android: `http://${isExpoTunnel ? FALLBACK_IP : expoHost}:3000/v1`,
  default: `http://localhost:3000/v1`,
});

export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || DEV_API_URL || '',
  PRIMARY_COLOR: '#CC0D00',
};

// Logging configuration for debugging
console.log('--- [Config] ---');
console.log('Expo Host:', expoHost);
console.log('Is Expo Tunnel:', isExpoTunnel);
console.log('Env API URL:', process.env.EXPO_PUBLIC_API_URL || 'Not Set');
console.log('FINAL API URL:', Config.API_URL);
console.log('----------------');
