import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Khi chạy qua Expo tunnel (ngrok), debuggerHost là *.exp.direct → không gọi được backend LAN.
// Trong trường hợp đó dùng FALLBACK_IP (IP LAN máy dev) để gọi backend.
const FALLBACK_IP = '192.168.55.104';

const expoHost = Constants.expoGoConfig?.debuggerHost?.split(':')[0]
  ?? Constants.expoConfig?.hostUri?.split(':')[0]
  ?? FALLBACK_IP;

const isExpoTunnel = /\.exp\.direct$/i.test(expoHost) || /\.ngrok\./i.test(expoHost);

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
