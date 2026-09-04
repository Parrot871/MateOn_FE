import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const JUST_SIGNED_UP_KEY = 'justSignedUp';

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await setItem(ACCESS_TOKEN_KEY, accessToken);
  await setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken() {
  return getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await deleteItem(ACCESS_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
}

export function setJustSignedUp() {
  return setItem(JUST_SIGNED_UP_KEY, 'true');
}

export async function peekJustSignedUp() {
  const value = await getItem(JUST_SIGNED_UP_KEY);
  return value === 'true';
}

export async function consumeJustSignedUp() {
  const value = await getItem(JUST_SIGNED_UP_KEY);
  await deleteItem(JUST_SIGNED_UP_KEY);
  return value === 'true';
}