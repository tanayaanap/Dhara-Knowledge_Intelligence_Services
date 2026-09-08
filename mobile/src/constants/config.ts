import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (debuggerHost
    ? `http://${debuggerHost}:5000`
    : 'http://127.0.0.1:5000');