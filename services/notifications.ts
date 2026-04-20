import { apiClient } from './client';
import type { Notification } from './types';

export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/notifications/');
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.post(`/notifications/${id}/mark_read/`, {});
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark_all_read/', {});
  },
};
