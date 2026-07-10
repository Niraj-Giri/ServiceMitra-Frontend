import { apiClient } from './client';

export interface SignupRequest {
  name: string;
  phone: string;
  email: string;
  role: 'CUSTOMER' | 'PROVIDER';
  serviceCategory?: string;
  referredBy?: string;
}

export const sendOtp = async (phone: string) => {
  const response = await apiClient.post('/auth/send-otp', { phone });
  return response.data;
};

export const verifyOtp = async (phone: string, otp: string, role?: string) => {
  const response = await apiClient.post('/auth/verify-otp', { phone, otp, role });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};


export const signupUser = async (data: SignupRequest) => {
  const response = await apiClient.post('/auth/signup', data);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const providerRegister = async (data: any) => {
  const response = await apiClient.post('/auth/provider-register', data);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch (err) {
    console.error('Logout API call failed', err);
  } finally {
    localStorage.removeItem('token');
  }
};
