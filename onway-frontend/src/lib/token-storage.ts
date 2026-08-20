const TOKEN_STORAGE_KEY = "onway_token";


export const tokenStorage = {
  get(): string | null {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  },
  set(token: string): void {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  },
  clear(): void {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};