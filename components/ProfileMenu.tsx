"use client";

import { useEffect, useRef, useState } from "react";
import { loadProfile, saveProfile, clearProfile, type Profile } from "@/lib/profile";

const AVATAR_CHOICES = ["🦉", "🐢", "🦊", "🐙", "🐝", "🦁", "🐧", "🦈"];

export default function ProfileMenu() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [avatarDraft, setAvatarDraft] = useState(AVATAR_CHOICES[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intentional one-time hydration from localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setLoaded(true);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const startEditing = () => {
    setNameDraft(profile?.name ?? "");
    setAvatarDraft(profile?.avatar ?? AVATAR_CHOICES[0]);
    setEditing(true);
    setOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameDraft.trim();
    if (!name) return;
    const next: Profile = { name, avatar: avatarDraft };
    saveProfile(next);
    setProfile(next);
    setEditing(false);
    setOpen(false);
  };

  const remove = () => {
    clearProfile();
    setProfile(null);
    setOpen(false);
    setEditing(false);
  };

  if (!loaded) return <div className="h-8 w-8" />;

  return (
    <div ref={containerRef} className="relative">
      {profile && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-lg hover:bg-background"
          aria-label="Profile menu"
        >
          {profile.avatar}
        </button>
      ) : !profile && !editing ? (
        <button
          type="button"
          onClick={startEditing}
          className="rounded-full bg-background/60 px-3 py-1.5 text-sm font-medium text-muted hover:bg-background hover:text-foreground"
        >
          Set up profile
        </button>
      ) : null}

      {open && !editing && profile && (
        <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-3 py-2 text-sm">
            <span className="mr-1.5">{profile.avatar}</span>
            <span className="font-medium text-foreground">{profile.name}</span>
          </div>
          <button
            type="button"
            onClick={startEditing}
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-background"
          >
            Edit profile
          </button>
          <button
            type="button"
            onClick={remove}
            className="block w-full px-3 py-2 text-left text-sm text-negative hover:bg-background"
          >
            Clear profile
          </button>
        </div>
      )}

      {editing && (
        <form
          onSubmit={save}
          className="absolute right-0 z-10 mt-2 w-64 space-y-3 rounded-xl border border-border bg-surface p-4 shadow-lg"
        >
          <div>
            <label className="text-xs text-muted">Name</label>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
              placeholder="Your name"
              className="mt-1 w-full rounded border border-border bg-transparent px-2 py-1.5 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted">Avatar</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {AVATAR_CHOICES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatarDraft(a)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ${
                    avatarDraft === a ? "bg-accent/20 ring-2 ring-accent" : "hover:bg-background"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] leading-tight text-muted">
              Saved only in this browser — not a real account.
            </p>
            <button
              type="submit"
              className="shrink-0 rounded bg-foreground px-3 py-1.5 text-sm font-medium text-background"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
