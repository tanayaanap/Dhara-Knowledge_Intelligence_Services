import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const COOKIE_KEY = 'dhara.session.cookie';
const USER_KEY = 'dhara.cached.user';

const secure = Platform.OS === 'web'
  ? {
      getItemAsync: AsyncStorage.getItem,
      setItemAsync: AsyncStorage.setItem,
      deleteItemAsync: AsyncStorage.removeItem,
    }
  : SecureStore;

export async function getSessionCookie() {
  return secure.getItemAsync(COOKIE_KEY);
}

export async function setSessionCookie(cookie: string) {
  await secure.setItemAsync(COOKIE_KEY, cookie);
}

export async function clearSessionCookie() {
  await secure.deleteItemAsync(COOKIE_KEY);
}

export async function setCachedUser(value: unknown) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(value));
}

export async function getCachedUser<T>() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function clearCachedUser() {
  await AsyncStorage.removeItem(USER_KEY);
}
