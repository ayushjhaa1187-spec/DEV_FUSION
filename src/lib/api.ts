export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'API error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw err;
  }
}

export const authApi = {
  getMyProfile: () => apiFetch('/api/profile'),
  updateProfile: (data: unknown) =>
    apiFetch('/api/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  getMySubjects: () => apiFetch('/api/profile/subjects'),
  updateSubjects: (ids: string[]) =>
    apiFetch('/api/profile/subjects', { method: 'POST', body: JSON.stringify({ subject_ids: ids }) }),
  getMyAnswers: () => apiFetch('/api/profile/answers'),
};

export const reputationApi = {
  getHistory: (limit = 20, offset = 0) =>
    apiFetch(`/api/reputation?limit=${limit}&offset=${offset}`),
  awardDailyLogin: () =>
    apiFetch('/api/auth/daily-login', { method: 'POST' }),
};

export const badgeApi = {
  getBadges: () => apiFetch('/api/badges'),
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
  // Fixed: use actual route structure /api/doubts/:doubtId/accept/:answerId with PATCH
  acceptAnswer: (doubtId: string, answerId: string) =>
    apiFetch(`/api/doubts/${doubtId}/accept/${answerId}`, { method: 'PATCH' }),
  vote: (answerId: string, vote_type: 'up' | 'down') =>
    apiFetch(`/api/answers/${answerId}/vote`, { method: 'POST', body: JSON.stringify({ vote_type }) }),
};

export const mentorApi = {
  getMentors: (filters?: Record<string, string>) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiFetch(`/api/mentors${query}`);
  },
  getSlots: (mentorId: string) => apiFetch(`/api/mentor-slots?mentor_id=${mentorId}`),
  getProfile: (id: string) => apiFetch(`/api/mentors/${id}`),
  getReviews: (id: string, limit = 5, offset = 0) => 
    apiFetch(`/api/mentors/${id}/reviews?limit=${limit}&offset=${offset}`),
  createOrder: (slotId: string) => 
    apiFetch('/api/payments/create-order', { method: 'POST', body: JSON.stringify({ slot_id: slotId }) }),
};

export const bookingApi = {
  create: (data: { 
    slot_id: string; 
    razorpay_order_id?: string; 
    razorpay_payment_id?: string; 
    razorpay_signature?: string; 
  }) =>
    apiFetch('/api/mentor-bookings', { method: 'POST', body: JSON.stringify(data) }),
};

export const subjectApi = {
  getSubjects: () => apiFetch('/api/subjects'),
};

export const testApi = {
  getHistory: (subjectId?: string) => 
    apiFetch(`/api/tests/history${subjectId ? `?subjectId=${subjectId}` : ''}`),
  generate: (data: { subject_id: string; topic: string }) => 
    apiFetch('/api/tests/generate', { method: 'POST', body: JSON.stringify(data) }),
  start: (testId: string) =>
    apiFetch(`/api/tests/${testId}/start`, { method: 'POST' }),
  saveAnswer: (data: { attempt_id: string; question_id: string; selected_index: number }) =>
    apiFetch('/api/tests/save-answer', { method: 'POST', body: JSON.stringify(data) }),
  submit: (attemptId: string) =>
    apiFetch(`/api/tests/${attemptId}/submit`, { method: 'POST', body: JSON.stringify({ attemptId }) }),
};


export const aiApi = {
  solveDoubt: (data: unknown) => apiFetch('/api/ai/solve', { method: 'POST', body: JSON.stringify(data) }),
};

export const notificationApi = {
  getNotifications: () => apiFetch('/api/notifications'),
  getUnreadCount: () => apiFetch('/api/notifications/unread'),
  markRead: (id: string) =>
    apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify({ notification_id: id }) }),
  markAllRead: () =>
    apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify({ mark_all: true }) }),
};

export const leaderboardApi = {
  getTop: (limit: number = 10) => apiFetch(`/api/leaderboard?limit=${limit}&timeframe=allTime`),
  getWeekly: (limit: number = 10) => apiFetch(`/api/leaderboard?limit=${limit}&timeframe=weekly`),
};
