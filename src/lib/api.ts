/*
  Phase 2 Fix: Connecting frontend to the COMPLETE Next.js/Supabase backend routes.
  This removes the 'localhost:5000' blocker and uses relative API calls.
*/
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Relative URLs for seamless Vercel deployment
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API error' }));
    throw new Error(error.message || 'API error');
  }
  return response.json();
}
export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { name: string; email: string; password: string }) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getSession: () => apiFetch('/api/auth/session'),
  getMyProfile: () => apiFetch('/api/profile'),
};
export const doubtApi = {
  getDoubts: (filters?: any) => {
    const query = new URLSearchParams(filters).toString();
    return apiFetch(`/api/doubts${query ? `?${query}` : ''}`);
  },
  createDoubt: (data: any) => apiFetch('/api/doubts', { method: 'POST', body: JSON.stringify(data) }),
  getDoubt: (id: string) => apiFetch(`/api/doubts/${id}`),
};
export const answerApi = {
  getAnswers: (doubtId: string) => apiFetch(`/api/doubts/${doubtId}/answers`),
  postAnswer: (doubtId: string, data: any) => apiFetch(`/api/doubts/${doubtId}/answers`, { method: 'POST', body: JSON.stringify(data) }),
  acceptAnswer: (answerId: string) => apiFetch(`/api/answers/${answerId}/accept`, { method: 'POST' }),
  vote: (answerId: string, value: number) => apiFetch(`/api/answers/${answerId}/vote`, { method: 'POST', body: JSON.stringify({ value }) }),
};
export const mentorApi = {
  getMentors: (filters?: any) => {
    const query = new URLSearchParams(filters).toString();
    return apiFetch(`/api/mentors${query ? `?${query}` : ''}`);
  },
  getSlots: (mentorId: string) => apiFetch(`/api/mentor-slots?mentor_id=${mentorId}`),
  getProfile: (id: string) => apiFetch(`/api/mentors/${id}`),
};
export const bookingApi = {
  create: (data: { slot_id: string }) => apiFetch('/api/mentor-bookings', { method: 'POST', body: JSON.stringify(data) }),
};
export const subjectApi = {
  getSubjects: () => apiFetch('/api/subjects'),
};
export const testApi = {
  generate: (data: any) => apiFetch('/api/tests/generate', { method: 'POST', body: JSON.stringify(data) }),
  submit: (testId: string, answers: number[]) => apiFetch(`/api/tests/${testId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
};
export const aiApi = {
  solveDoubt: (data: any) => apiFetch('/api/ai/solve', { method: 'POST', body: JSON.stringify(data) }),
};
export const notificationApi = {
  getNotifications: () => apiFetch('/api/notifications'),
  getUnreadCount: () => apiFetch('/api/notifications/unread'),
};
