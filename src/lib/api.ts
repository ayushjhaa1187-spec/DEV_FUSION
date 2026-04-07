const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API error' }));
    throw new Error(error.message || 'API error');
  }

  return response.json();
}

export const authApi = {
  login: (data: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

export const doubtApi = {
  getDoubts: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/doubts${query ? `?${query}` : ''}`);
  },
  createDoubt: (data: any) => apiFetch('/doubts', { method: 'POST', body: JSON.stringify(data) }),
  getDoubt: (id: string) => apiFetch(`/doubts/${id}`),
};

export const answerApi = {
  getAnswers: (doubtId: string) => apiFetch(`/answers/doubt/${doubtId}`),
  postAnswer: (data: any) => apiFetch('/answers', { method: 'POST', body: JSON.stringify(data) }),
  acceptAnswer: (id: string) => apiFetch(`/answers/${id}/accept`, { method: 'POST' }),
};

export const mentorApi = {
  getMentors: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/mentors/directory${query ? `?${query}` : ''}`);
  },
  getProfile: (userId?: string) => apiFetch(`/mentors/profile${userId ? `/${userId}` : ''}`),
  apply: (data: any) => apiFetch('/mentors/apply', { method: 'POST', body: JSON.stringify(data) }),
  getSlots: (mentorId: string) => apiFetch(`/mentors/slots/${mentorId}`),
  createSlots: (data: any) => apiFetch('/mentors/slots', { method: 'POST', body: JSON.stringify(data) }),
};

export const bookingApi = {
  create: (data: any) => apiFetch('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  verify: (data: any) => apiFetch('/bookings/verify', { method: 'POST', body: JSON.stringify(data) }),
};

export const aiApi = {
  solveDoubt: (text: string) => apiFetch('/ai/solve', { method: 'POST', body: JSON.stringify({ text }) }),
};

export const testApi = {
  generate: (data: any) => apiFetch('/tests/generate', { method: 'POST', body: JSON.stringify(data) }),
  submit: (data: any) => apiFetch('/tests/submit', { method: 'POST', body: JSON.stringify(data) }),
  getAttempts: () => apiFetch('/tests/attempts'),
};

export const notificationApi = {
  getNotifications: () => apiFetch('/notifications'),
  markAsRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
  getUnreadCount: () => apiFetch('/notifications/unread-count'),
};
