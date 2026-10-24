import { ApiClient } from '@ai-study/api-client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// For local Android emulator, localhost is 10.0.2.2; for iOS simulator, it's localhost
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1';

export const mobileApi = new ApiClient({
  baseUrl: DEFAULT_HOST,
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch {
      return null;
    }
  },
  onUnauthorized: async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch {}
  }
});
