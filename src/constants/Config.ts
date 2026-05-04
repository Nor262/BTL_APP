import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || DEV_API_URL,
  PRIMARY_COLOR: '#CC0D00',
};
