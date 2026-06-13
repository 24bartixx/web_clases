import { auth_fetch } from '../utils/auth_fetch';
import { apiUrl } from '../utils/apiUrl';

export type UserInfo = {
  user_id: number;
  first_name: string;
  picture: string | null;
};

export async function getUserInfo(): Promise<UserInfo> {
  const response = await auth_fetch(apiUrl('/api/users/me'));

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
