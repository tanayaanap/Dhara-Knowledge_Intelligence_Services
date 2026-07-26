import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import {
  AuthResponse,
  CropPredictionInput,
  CropPredictionResult,
  OcrScanResult,
  Stats,
  User,
} from '@/types/api';
import { getSessionCookie, setSessionCookie } from './session-store';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const cookie = await getSessionCookie();
  if (cookie) {
    config.headers.Cookie = cookie;
  }
  return config;
});

api.interceptors.response.use((response) => {
  const setCookie = response.headers['set-cookie'];
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (cookie) {
    void setSessionCookie(cookie.split(';')[0]);
  }
  return response;
});

export async function login(input: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>('/api/login', input);
  return data;
}

export async function register(input: { name: string; email: string; password: string; location?: string; land_size?: string }) {
  const { data } = await api.post<{ success: boolean; error?: string }>('/api/register', input);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<{ authenticated: boolean; email?: string; name?: string }>('/api/user');
  return data.authenticated && data.email ? { email: data.email, name: data.name || '' } : null;
}

export async function getStats() {
  const { data } = await api.get<Stats>('/api/stats');
  return data;
}

export async function getProfile() {
  const { data } = await api.get<User>('/api/profile');
  return data;
}

export async function updateProfile(input: Pick<User, 'name' | 'location' | 'land_size'>) {
  const { data } = await api.put<{ success: boolean; error?: string }>('/api/profile', input);
  return data;
}

export async function logout() {
  const { data } = await api.post<{ success: boolean }>('/api/logout');
  return data;
}

export async function predictCrop(input: CropPredictionInput) {
  const { data } = await api.post<CropPredictionResult>('/api/predict', input);
  return data;
}

export async function scanSoilReport(file: { uri: string; name: string; mimeType?: string }) {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  } as unknown as Blob);
  const { data } = await api.post<OcrScanResult>('/api/ocr-scan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function sendChatMessage(message: string) {
  const { data } = await api.post<{ reply: string }>('/api/chat', { message });
  return data.reply;
}
