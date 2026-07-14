import { apiClient } from './client';
import type { TaskRequest, Quote } from '../types';

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface CreateTaskPayload {
  serviceId: number;
  title: string;
  description: string;
  budgetMinNpr: number;
  budgetMaxNpr: number;
  address: string;
  latitude?: number;
  longitude?: number;
  preferredDate?: string;
  preferredSlots?: string[];
  pointsToRedeem?: number;
}

export const postTask = (payload: CreateTaskPayload): Promise<TaskRequest> =>
  apiClient.post('/tasks', payload).then(r => r.data);

export const getMyTasks = (): Promise<TaskRequest[]> =>
  apiClient.get('/tasks/my').then(r => r.data);

export const getTaskById = (id: number, asProvider = false): Promise<TaskRequest> =>
  apiClient.get(`/tasks/${id}`, { params: { asProvider } }).then(r => r.data);

export const cancelTask = (id: number, reason?: string): Promise<TaskRequest> =>
  apiClient.delete(`/tasks/${id}`, { data: { reason } }).then(r => r.data);

export const acceptQuote = (taskId: number, quoteId: number): Promise<TaskRequest> =>
  apiClient.put(`/tasks/${taskId}/quotes/${quoteId}/accept`).then(r => r.data);

export const counterOffer = (taskId: number, quoteId: number, counterPriceNpr: number): Promise<Quote> =>
  apiClient.put(`/tasks/${taskId}/quotes/${quoteId}/counter`, { counterPriceNpr }).then(r => r.data);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const getAvailableTasks = (): Promise<TaskRequest[]> =>
  apiClient.get('/tasks/available').then(r => r.data);

export const getMyQuotes = (): Promise<Quote[]> =>
  apiClient.get('/tasks/my-quotes').then(r => r.data);

export const submitQuote = (taskId: number, quotedPriceNpr: number, message: string): Promise<Quote> =>
  apiClient.post(`/tasks/${taskId}/quotes`, { quotedPriceNpr, message }).then(r => r.data);

export const respondToCounter = (taskId: number, quoteId: number, accept: boolean): Promise<TaskRequest> =>
  apiClient.put(`/tasks/${taskId}/quotes/${quoteId}/respond`, { accept }).then(r => r.data);

export const withdrawQuote = (taskId: number, quoteId: number): Promise<Quote> =>
  apiClient.delete(`/tasks/${taskId}/quotes/${quoteId}`).then(r => r.data);

export const getProviderTasks = (): Promise<TaskRequest[]> =>
  apiClient.get('/tasks/provider').then(r => r.data);

export const startTask = (taskId: number, otp: string): Promise<TaskRequest> =>
  apiClient.post(`/tasks/${taskId}/start`, { otp }).then(r => r.data);

export const completeTask = (taskId: number): Promise<TaskRequest> =>
  apiClient.post(`/tasks/${taskId}/complete`).then(r => r.data);

export const providerCancelTask = (taskId: number, reason?: string): Promise<TaskRequest> =>
  apiClient.post(`/tasks/${taskId}/provider-cancel`, { reason }).then(r => r.data);

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminGetAllTasks = (status?: string): Promise<TaskRequest[]> =>
  apiClient.get('/tasks/admin/all', { params: status ? { status } : {} }).then(r => r.data);

export const adminCancelTask = (id: number, reason?: string): Promise<TaskRequest> =>
  apiClient.put(`/tasks/admin/${id}/cancel`, { reason }).then(r => r.data);
