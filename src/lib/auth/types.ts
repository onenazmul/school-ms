export type SessionUser = {
  id: string;
  name: string;
  email?: string | null;
  username?: string | null;
  role: string;
};
