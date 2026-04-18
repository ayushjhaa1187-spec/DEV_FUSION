/**
 * apiFetch
 * Optimized fetch wrapper with timeout and robust error handling.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

    const json = await response.json().catch(() => ({ success: false, error: `Server error (${response.status})` }));
    
    if (!response.ok) {
       const error: any = new Error(json.error || json.message || `HTTP ${response.status}`);
       error.status = response.status;
       throw error;
    }

    // Auto-unwrap standardized { success: true, data: ... } responses
    if (json.success === true && 'data' in json) {
      return json.data;
    }

    return json;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('Request timed out. The network is slow or the service is unresponsive.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const authApi = {
  getMyProfile: () => apiFetch('/api/profile'),
  updateProfile: (data: unknown) => apiFetch('/api/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  getMySubjects: () => apiFetch('/api/profile/subjects'),
  updateSubjects: (ids: string[]) => apiFetch('/api/profile/subjects', { method: 'POST', body: JSON.stringify({ subject_ids: ids }) }),
  getMyAnswers: () => apiFetch('/api/profile/answers'),
};

export const reputationApi = {
  getHistory: (limit = 20, offset = 0) => apiFetch(`/api/reputation?limit=${limit}&offset=${offset}`),
  awardDailyLogin: () => apiFetch('/api/auth/daily-login', { method: 'POST' }),
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
  postAnswer: (doubtId: string, data: unknown) => apiFetch(`/api/doubts/${doubtId}/answers`, { method: 'POST', body: JSON.stringify(data) }),
  acceptAnswer: (doubtId: string, answerId: string) => apiFetch(`/api/doubts/${doubtId}/accept/${answerId}`, { method: 'PATCH' }),
  vote: (answerId: string, vote_type: 'up' | 'down') => apiFetch(`/api/answers/${answerId}/vote`, { method: 'POST', body: JSON.stringify({ vote_type }) }),
};

export const mentorApi = {
  getMentors: (filters?: Record<string, string>) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiFetch(`/api/mentors${query}`);
  },
  getSlots: (mentorId: string, date: string) => apiFetch(`/api/mentors/${mentorId}/slots?date=${date}`),
  getProfile: (id: string) => apiFetch(`/api/mentors/${id}`),
  getReviews: (id: string, limit: number = 5, offset: number = 0) => apiFetch(`/api/mentors/${id}/reviews?limit=${limit}&offset=${offset}`),
};

export const bookingApi = {
  initiate: (data: { mentor_id: string, slot_id: string }) => apiFetch('/api/bookings/initiate', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data: { booking_id: string, razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) => apiFetch('/api/bookings/verify-payment', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: () => apiFetch('/api/mentor-bookings'),
};

export const subjectApi = {
  getSubjects: () => apiFetch('/api/subjects'),
};

export const testApi = {
  getHistory: (subjectId?: string) => apiFetch(`/api/tests/history${subjectId ? `?subjectId=${subjectId}` : ''}`),
  generate: (data: { subject_id: string; topic: string }) => apiFetch('/api/tests/generate', { method: 'POST', body: JSON.stringify(data) }, 60000),
  start: (testId: string) => apiFetch(`/api/tests/${testId}/start`, { method: 'POST' }),
  saveAnswer: (data: { attempt_id: string; question_id: string; selected_index: number }) => apiFetch('/api/tests/save-answer', { method: 'POST', body: JSON.stringify(data) }),
  submit: (attemptId: string) => apiFetch(`/api/tests/${attemptId}/submit`, { method: 'POST', body: JSON.stringify({ attemptId }) }),
};

export const aiApi = {
  getUsage: () => apiFetch('/api/usage/status'),
  solveDoubt: (data: unknown) => apiFetch('/api/ai/solve', { method: 'POST', body: JSON.stringify(data) }, 60000),
  logActivity: () => apiFetch('/api/usage/log', { method: 'POST' }),
};

export const notificationApi = {
  getNotifications: () => apiFetch('/api/notifications'),
  getUnreadCount: () => apiFetch('/api/notifications/unread'),
  markRead: (id: string) => apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify({ notification_id: id }) }),
};

export const leaderboardApi = {
  getTop: (limit: number = 10) => apiFetch(`/api/leaderboard?limit=${limit}&timeframe=allTime`),
  getWeekly: (limit: number = 10) => apiFetch(`/api/leaderboard?limit=${limit}&timeframe=weekly`),
};

export const certificateApi = {
  generate: (data: { subject: string; score: number; certType: string; razorpayPaymentId?: string }) => 
    apiFetch('/api/certificates/generate', { method: 'POST', body: JSON.stringify(data) }),
  getMyCertificates: () => apiFetch('/api/dashboard/certificates'), // This will likely reach the page's fetch logic or a dedicated route
};
