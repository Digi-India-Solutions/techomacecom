import type { AdminNotificationFeed } from '@/types/admin';
import { adminGet, adminPost } from './client';

/**
 * Admin bell — backend /api/v1/admin/notifications.
 *   items      alerts addressed to me (new orders, return requests, rental bookings, failed refunds…)
 *   attention  live counts for modules I can open (overdue rentals, KYC queue, low stock…)
 */
export const getNotificationFeed = () => adminGet<AdminNotificationFeed>('/admin/notifications');
export const markNotificationRead = (id: string) => adminPost<AdminNotificationFeed>(`/admin/notifications/${encodeURIComponent(id)}/read`);
export const markAllNotificationsRead = () => adminPost<AdminNotificationFeed>('/admin/notifications/read-all');
