export type Moderator = {
  id: string;
  username: string;
  email: string | null;
  phone_number: string | null;
  role: "moderator";
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
