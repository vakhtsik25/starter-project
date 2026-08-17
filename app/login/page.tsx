import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-10 shadow-lg">
        <div className="mb-7 text-center">
          <div className="text-xl font-bold tracking-tight text-foreground">
            FinLens
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Investor snapshots from the primary source
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-background"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.4-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 45c5.4 0 10.3-1.8 14.1-5l-6.5-5.5C29.6 36.4 26.9 37 24 37c-5.4 0-9.9-3.1-11.4-7.5l-6.6 5.1C9.6 40.6 16.3 45 24 45z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.9 2.6-2.6 4.8-4.7 6.4l6.5 5.5C40.6 37 44 31 44 24c0-1.4-.1-2.4-.4-3.5z"
              />
            </svg>
            Sign in with Google
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-muted">
          Only signed-in users can view company dashboards, screener, and
          news.
        </p>
      </div>
    </main>
  );
}
