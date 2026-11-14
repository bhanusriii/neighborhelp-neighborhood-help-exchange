import {
  User,
  UserStatus,
  HelpRequest,
  Offer,
  Exchange,
  RatingReview,
  Message,
  NotificationItem,
  LocationCoords,
  Report,
  AdminStats,
  AdminActivityItem,
} from './types';

const TOKEN_KEY = 'neighborhood_help_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Option 1: Neighbor (User) Registration & Sign In
  async register(payload: {
    name: string;
    email: string;
    password: string;
    neighborhood: string;
    lat: number;
    lng: number;
    bio?: string;
  }): Promise<{ user: User; token: string; activeRequestsCount: number }> {
    const res = await request<{ user: User; token: string; activeRequestsCount: number }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    setStoredToken(res.token);
    return res;
  },

  async login(payload: { email: string; password: string }): Promise<{ user: User; token: string; activeRequestsCount: number }> {
    const res = await request<{ user: User; token: string; activeRequestsCount: number }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    setStoredToken(res.token);
    return res;
  },

  // Option 2: Administrator Sign In (Separate Admin Portal)
  async adminLogin(payload: { email: string; password: string }): Promise<{ user: User; token: string; activeRequestsCount: number; role: 'admin' }> {
    const res = await request<{ user: User; token: string; activeRequestsCount: number; role: 'admin' }>(
      '/api/auth/admin-login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    setStoredToken(res.token);
    return res;
  },

  // Forgot Password & Reset
  async forgotPassword(email: string): Promise<{ success: boolean; message: string; code?: string }> {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(payload: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      removeStoredToken();
    }
  },

  async getCurrentUser(): Promise<{ user: User; activeRequestsCount: number }> {
    return request<{ user: User; activeRequestsCount: number }>('/api/auth/me');
  },

  async updateLocation(payload: { lat: number; lng: number; neighborhood: string }): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/location', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async getDemoUsers(): Promise<{ demoUsers: User[] }> {
    return request<{ demoUsers: User[] }>('/api/auth/demo-users');
  },

  async switchDemoUser(email: string): Promise<{ user: User; token: string; activeRequestsCount: number }> {
    const res = await request<{ user: User; token: string; activeRequestsCount: number }>(
      '/api/auth/demo-switch',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
    setStoredToken(res.token);
    return res;
  },

  // Feed & Requests (10 km Geospatial Filter)
  async getFeed(params: {
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
    urgency?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: HelpRequest[]; total: number; page: number; pageSize: number; hasMore: boolean; viewerLocation: LocationCoords }> {
    const query = new URLSearchParams();
    if (params.lat !== undefined) query.set('lat', params.lat.toString());
    if (params.lng !== undefined) query.set('lng', params.lng.toString());
    if (params.radius) query.set('radius', params.radius.toString());
    if (params.category) query.set('category', params.category);
    if (params.urgency) query.set('urgency', params.urgency);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page.toString());
    if (params.pageSize) query.set('pageSize', params.pageSize.toString());

    return request(`/api/feed?${query.toString()}`);
  },

  async getRequestDetails(id: string, lat?: number, lng?: number): Promise<{
    request: HelpRequest;
    offers: Offer[];
    exchange?: Exchange;
    isOwner: boolean;
  }> {
    const query = new URLSearchParams();
    if (lat !== undefined) query.set('lat', lat.toString());
    if (lng !== undefined) query.set('lng', lng.toString());
    return request(`/api/requests/${id}?${query.toString()}`);
  },

  async createRequest(payload: {
    title: string;
    description: string;
    category: string;
    urgency: string;
    neighborhood?: string;
    lat?: number;
    lng?: number;
    photoUrl?: string;
  }): Promise<{ request: HelpRequest; activeRequestsCount: number; message: string }> {
    return request('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async cancelRequest(id: string): Promise<{ request: HelpRequest; activeRequestsCount: number }> {
    return request(`/api/requests/${id}/cancel`, { method: 'POST' });
  },

  // Offers
  async submitOffer(requestId: string, message: string): Promise<{ offer: Offer; message: string }> {
    return request(`/api/requests/${requestId}/offers`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async acceptOffer(requestId: string, offerId: string): Promise<{ request: HelpRequest; offer: Offer; message: string }> {
    return request(`/api/requests/${requestId}/accept-offer`, {
      method: 'POST',
      body: JSON.stringify({ offerId }),
    });
  },

  async completeExchange(requestId: string): Promise<{
    request: HelpRequest;
    exchange: Exchange;
    user: User;
    activeRequestsCount: number;
    message: string;
  }> {
    return request(`/api/requests/${requestId}/complete`, { method: 'POST' });
  },

  // Messaging Thread
  async getMessages(requestId: string): Promise<{ messages: Message[] }> {
    return request(`/api/requests/${requestId}/messages`);
  },

  async sendMessage(requestId: string, body: string, recipientId?: string): Promise<{ message: Message }> {
    return request(`/api/requests/${requestId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, recipientId }),
    });
  },

  // Reviews
  async submitReview(requestId: string, rating: number, comment: string): Promise<{ review: RatingReview; message: string }> {
    return request(`/api/requests/${requestId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },

  // Community Reports
  async createReport(payload: {
    targetType: 'user' | 'request';
    targetId: string;
    targetTitleOrName: string;
    reason: string;
    details?: string;
  }): Promise<{ report: Report; message: string }> {
    return request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // User Data & Profiles
  async getUserProfile(userId: string): Promise<{ user: User; reviews: RatingReview[] }> {
    return request(`/api/users/${userId}/profile`);
  },

  async getMyRequests(): Promise<{ requests: HelpRequest[] }> {
    return request('/api/users/me/requests');
  },

  async getMyOffers(): Promise<{ offers: { offer: Offer; request: HelpRequest }[] }> {
    return request('/api/users/me/offers');
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return request('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<void> {
    await request(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead(): Promise<void> {
    await request('/api/notifications/read-all', { method: 'POST' });
  },

  // ---------------------------------------------------------------------------
  // Administrator APIs
  // ---------------------------------------------------------------------------
  async getAdminOverview(): Promise<{ stats: AdminStats; recentActivities: AdminActivityItem[] }> {
    return request('/api/admin/overview');
  },

  async getAdminUsers(params?: { query?: string; status?: string }): Promise<{ users: User[] }> {
    const q = new URLSearchParams();
    if (params?.query) q.set('query', params.query);
    if (params?.status) q.set('status', params.status);
    return request(`/api/admin/users?${q.toString()}`);
  },

  async updateUserStatus(userId: string, status: UserStatus): Promise<{ user: User; message: string }> {
    return request(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/admin/users/${userId}`, { method: 'DELETE' });
  },

  async getAdminRequests(params?: { query?: string; category?: string; status?: string }): Promise<{ requests: HelpRequest[] }> {
    const q = new URLSearchParams();
    if (params?.query) q.set('query', params.query);
    if (params?.category) q.set('category', params.category);
    if (params?.status) q.set('status', params.status);
    return request(`/api/admin/requests?${q.toString()}`);
  },

  async deleteAdminRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/admin/requests/${requestId}`, { method: 'DELETE' });
  },

  async getAdminReports(status?: string): Promise<{ reports: Report[] }> {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    return request(`/api/admin/reports?${q.toString()}`);
  },

  async handleReportAction(reportId: string, payload: { action: string; note?: string }): Promise<{ success: boolean; message: string; report: Report }> {
    return request(`/api/admin/reports/${reportId}/action`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAdminActivity(): Promise<{ activities: AdminActivityItem[] }> {
    return request('/api/admin/activity');
  },
};
