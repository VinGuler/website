export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
