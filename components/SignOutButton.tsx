import { signOut } from "@/auth";

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="rounded-full bg-background/60 px-3 py-1.5 text-sm font-medium text-muted hover:bg-background hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  );
}
