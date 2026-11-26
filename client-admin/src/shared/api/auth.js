import { axiosAuth } from './api';

// ================= AUTH =================
export const login = async (data) => {
  return await axiosAuth.post('/auth/login', data);
};

export const logout = async () => {
  return await axiosAuth.post('/auth/logout', {});
};

export const register = async (data) => {
  return await axiosAuth.post('/auth/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const forgotPassword = async (email) => {
  return await axiosAuth.post('/auth/forgot-password', { email });
};

export const resetPassword = async (token, newPassword) => {
  return await axiosAuth.post('/auth/reset-password', { token, newPassword });
};

export const verifyEmail = async (token) => {
  return await axiosAuth.post('/auth/verify-email', { token });
};

export const updateUserRole = async (userId, roleName) => {
  return await axiosAuth.put(`/users/${userId}/role`, { roleName });
};

export const updateUser = async (userId, body) => {
  const { data } = await axiosAuth.put(`/auth/users/${userId}`, body);
  return data?.data ?? data;
};

export const deactivateUser = async (userId) => {
  return axiosAuth.delete(`/auth/users/${userId}`);
};

export const getMyProfile = async () => {
  const { data } = await axiosAuth.get('/auth/profile');
  return data?.data ?? data;
};

export const updateMyProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  const { data } = await axiosAuth.post('/auth/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.data ?? data;
};

// ================= USERS =================
export const getAllUsers = async () => {
  const { data } = await axiosAuth.get('/auth/users');
  return { users: data };
};
