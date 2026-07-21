import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const JUST_SIGNED_UP_KEY = 'justSignedUp';

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export function setJustSignedUp() {
  return SecureStore.setItemAsync(JUST_SIGNED_UP_KEY, 'true');
}

export async function peekJustSignedUp() {
  const value = await SecureStore.getItemAsync(JUST_SIGNED_UP_KEY);
  return value === 'true';
}

export async function consumeJustSignedUp() {
  const value = await SecureStore.getItemAsync(JUST_SIGNED_UP_KEY);
  await SecureStore.deleteItemAsync(JUST_SIGNED_UP_KEY);
  return value === 'true';
}
