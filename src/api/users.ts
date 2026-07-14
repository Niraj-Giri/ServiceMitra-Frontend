import { apiClient } from './client';
import type { User } from '../types';

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const updateProfile = async (data: Partial<User>) => {
  const response = await apiClient.put('/users/me', data);
  return response.data;
};

export const getAddresses = async () => {
  const response = await apiClient.get('/users/addresses');
  return response.data;
};

export const addAddress = async (data: { label: string; line1: string; latitude: number; longitude: number; isDefault?: boolean }) => {
  const response = await apiClient.post('/users/addresses', data);
  return response.data;
};

export const deleteAddress = async (id: number) => {
  const response = await apiClient.delete(`/users/addresses/${id}`);
  return response.data;
};
