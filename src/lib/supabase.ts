// Mocking Supabase for now until actual keys are provided
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signIn: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
      }),
      order: () => ({
        limit: async () => ({ data: [], error: null }),
      }),
    }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
  }),
};
