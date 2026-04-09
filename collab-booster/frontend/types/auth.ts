export type UserRole = "business_analyst" | "developer";

export interface AuthToken {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id: string;
  full_name: string;
}

export interface CurrentUser {
  user_id: string;
  full_name: string;
  role: UserRole;
  token: string;
}
