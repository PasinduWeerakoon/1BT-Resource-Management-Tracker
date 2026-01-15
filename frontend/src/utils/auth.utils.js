import { SAMPLE_USERS } from '@configs/auth.config';

export const authenticateUser = (username, password) => {
  // Check against sample users
  const user = Object.values(SAMPLE_USERS).find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    return {
      success: true,
      user: {
        id: user.username,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      token: `token_${user.username}_${Date.now()}`,
      role: user.role,
    };
  }

  return {
    success: false,
    message: 'Invalid username or password',
  };
};

export const getStoredAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const role = localStorage.getItem('role');

  if (token && user && role) {
    return {
      token,
      user: JSON.parse(user),
      role,
    };
  }

  return null;
};
