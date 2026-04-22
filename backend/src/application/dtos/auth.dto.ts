export interface LoginCommand {
  readonly email: string;
}

export interface RegisterCommand {
  readonly email: string;
}

export interface UserResponse {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string; // ISO 8601
}

export interface AuthResponse {
  readonly user: UserResponse;
  readonly token: string;
  readonly expiresIn: string;
}
