import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * API Configuration
 * 
 * To override the API URL, set the EXPO_PUBLIC_API_URL environment variable in your .env file:
 * EXPO_PUBLIC_API_URL=http://192.168.1.120:3000/v1
 */

// Hardcoded fallback IP - update this to your machine's local IP if needed
const FALLBACK_IP = '192.168.1.120'; 

const expoHost = Constants.expoGoConfig?.debuggerHost?.split(':')[0]
  ?? Constants.expoConfig?.hostUri?.split(':')[0]
  ?? FALLBACK_IP;

// Detect if we are using an Expo tunnel (exp.direct)
const isTunnel = expoHost.includes('exp.direct');

const DEV_API_URL = Platform.select({
  ios: `http://${isTunnel ? FALLBACK_IP : expoHost}:3000/v1`,
  android: `http://${isTunnel ? FALLBACK_IP : expoHost}:3000/v1`,
  default: `http://localhost:3000/v1`,
});

export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || DEV_API_URL || '',
  PRIMARY_COLOR: '#CC0D00',
};

// Logging configuration for debugging
console.log('--- [Config] ---');
console.log('Expo Host:', expoHost);
console.log('Is Tunnel:', isTunnel);
console.log('Env API URL:', process.env.EXPO_PUBLIC_API_URL || 'Not Set');
console.log('Fallback API URL:', DEV_API_URL);
console.log('FINAL API URL:', Config.API_URL);
console.log('----------------');
