import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${key}=`));
          return cookie ? cookie.split('=')[1] : null;
        },
        set(key: string, value: string, options: Record<string, unknown>) {
          let cookie = `${key}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
          if (options?.domain) cookie += `; domain=${options.domain}`;
          if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
          if (options?.secure || location.protocol === 'https:') cookie += '; Secure';
          document.cookie = cookie;
        },
        remove(key: string) {
          document.cookie = `${key}=; path=/; max-age=0`;
        },
      },
    }
  );
}
