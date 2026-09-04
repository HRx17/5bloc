/**
 * Temporary stand-in for the data client. Until the backend is connected,
 * reads return empty results and writes resolve without error, so the
 * ported pages render instead of crashing.
 */
type AnyRecord = Record<string, unknown>;

const emptyResult = { data: null as unknown, error: null as { message?: string; code?: string } | null };

export function createSupabaseClient(): any {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    order: () => Promise.resolve({ data: [], error: null }),
    limit: () => Promise.resolve({ data: [], error: null }),
    single: () => Promise.resolve(emptyResult),
    maybeSingle: () => Promise.resolve(emptyResult),
    insert: (_rows?: AnyRecord | AnyRecord[]) => Promise.resolve(emptyResult),
    update: () => chain,
    delete: () => chain,
    then: (resolve: (v: unknown) => unknown) => resolve({ data: [], error: null }),
  };

  return {
    from: () => chain,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  };
}

export const supabaseClient = createSupabaseClient();
export const createClient = createSupabaseClient;
