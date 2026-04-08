export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(endpoint, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const authApi = {
  getMyProfile: () => apiFetch('/api/profile'),
};

export const doubtApi = {
  getDoubts: (filters?: Record<string, string>) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiFetch(`/api/doubts${query}`);
  },
  createDoubt: (data: unknown) => apiFetch('/api/doubts', { method: 'POST', body: JSON.stringify(data) }),
  getDoubt: (id: string) => apiFetch(`/api/doubts/${id}`),
};

export const answerApi = {
  getAnswers: (doubtId: string) => apiFetch(`/api/doubts/${doubtId}/answers`),
  postAnswer: (doubtId: string, data: unknown) =>
    apiFetch(`/api/doubts/${doubtId}/answers`, { method: 'POST', body: JSON.stringify(data) }),
  acceptAnswer: (answerId: string) =>
    apiFetch(`/api/answers/${answerId}/accept`, { method: 'POST' }),
  vote: (answerId: string, vote_type: number) =>
    apiFetch(`/api/answers/${answerId}/vote`, { method: 'POST', body: JSON.stringify({ vote_type }) }),
};

export const mentorApi = {
  getMentors: (filters?: Record<string, string>) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiFetch(`/api/mentors${query}`);
  },
  getSlots: (mentorId: string) => apiFetch(`/api/mentor-slots?mentor_id=${mentorId}`),
  getProfile: (id: string) => apiFetch(`/api/mentors/${id}`),
};

export const bookingApi = {
  create: (data: { slot_id: string }) =>
    apiFetch('/api/mentor-bookings', { method: 'POST', body: JSON.stringify(data) }),
};

export const subjectApi = {
  getSubjects: () => apiFetch('/api/subjects'),
};

export const testApi = {
  generate: (data: unknown) => apiFetch('/api/tests/generate', { method: 'POST', body: JSON.stringify(data) }),
  submit: (testId: string, answers: number[]) =>
    apiFetch(`/api/tests/${testId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
};

export const aiApi = {
  solveDoubt: (data: unknown) => apiFetch('/api/ai/solve', { method: 'POST', body: JSON.stringify(data) }),
};

export const notificationApi = {
  getNotifications: () => apiFetch('/api/notifications'),
  getUnreadCount: () => apiFetch('/api/notifications/unread'),
};
