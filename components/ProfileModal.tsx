"use client";

import { useState } from "react";

export interface UserProfile {
  id: string;
  name: string;
  role: "viewer" | "editor";
  color: string;
  createdAt: string;
}

const COLORS = [
  "#00BAF2", "#6D28D9", "#DC2626", "#059669",
  "#D97706", "#DB2777", "#0891B2", "#7C3AED",
];

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
}

function Avatar({ profile, size = 8 }: { profile: UserProfile; size?: number }) {
  const sz = `w-${size} h-${size}`;
  const fs = size <= 6 ? "text-xs" : size <= 8 ? "text-sm" : "text-base";
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${fs}`}
      style={{ backgroundColor: profile.color }}>
      {initials(profile.name)}
    </div>
  );
}

export function ProfileBadge({ profile, onClick }: { profile: UserProfile; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
      <Avatar profile={profile} size={6} />
      <div className="text-left hidden sm:block">
        <p className="text-xs font-medium text-gray-800 leading-tight">{profile.name}</p>
        <p className="text-[10px] leading-tight" style={{ color: profile.role === "editor" ? "#00BAF2" : "#9CA3AF" }}>
          {profile.role === "editor" ? "Editor" : "Viewer"}
        </p>
      </div>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-400">
        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function ProfileModal({
  profiles,
  activeId,
  onSwitch,
  onAdd,
  onClose,
}: {
  profiles: UserProfile[];
  activeId: string | null;
  onSwitch: (id: string) => void;
  onAdd: (profile: UserProfile) => void;
  onClose: () => void;
}) {
  const [adding, setAdding]   = useState(profiles.length === 0);
  const [name,   setName]     = useState("");
  const [role,   setRole]     = useState<"viewer" | "editor">("viewer");
  const [color,  setColor]    = useState(COLORS[0]);
  const [error,  setError]    = useState("");

  function createProfile() {
    const trimmed = name.trim();
    if (!trimmed) { setError("Name is required"); return; }
    if (profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A profile with this name already exists"); return;
    }
    const profile: UserProfile = {
      id:        crypto.randomUUID(),
      name:      trimmed,
      role,
      color,
      createdAt: new Date().toISOString(),
    };
    onAdd(profile);
    setAdding(false); setName(""); setRole("viewer"); setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-80 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {adding && profiles.length > 0 && (
              <button onClick={() => { setAdding(false); setError(""); }}
                className="text-gray-400 hover:text-gray-600 transition-colors mr-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <p className="text-sm font-semibold text-gray-900">{adding ? "New Profile" : "Profiles"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Profile list */}
        {!adding && (
          <div className="py-2">
            {profiles.map((p) => {
              const isActive = p.id === activeId;
              return (
                <div key={p.id}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors ${isActive ? "bg-gray-50" : "hover:bg-gray-50/60"}`}>
                  <Avatar profile={p} size={8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                      style={{ color: p.role === "editor" ? "#00BAF2" : "#9CA3AF" }}>
                      {p.role}
                    </p>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] font-semibold text-gray-400">Active</span>
                  ) : (
                    <button onClick={() => { onSwitch(p.id); onClose(); }}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-[#00BAF2] hover:text-[#00BAF2] transition-all">
                      Switch
                    </button>
                  )}
                </div>
              );
            })}
            <div className="border-t border-gray-100 mt-2 pt-2 px-5 pb-3">
              <button onClick={() => setAdding(true)}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add new profile
              </button>
            </div>
          </div>
        )}

        {/* Add profile form */}
        {adding && (
          <div className="p-5 flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Name</label>
              <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && createProfile()}
                placeholder="e.g. Renuka Rajpuria"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors"
                onFocus={(e) => (e.target.style.borderColor = "#00BAF2")}
                onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
                autoFocus
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(["viewer", "editor"] as const).map((r) => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      role === r
                        ? "border-[#00BAF2] bg-[#EAF9FF] text-[#00BAF2]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    {r === "viewer" ? "👁 Viewer" : "✏️ Editor"}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {role === "viewer" ? "Can view escalations. Cannot update ticket status." : "Can view escalations and update ticket resolution status."}
              </p>
            </div>

            {/* Color */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Avatar Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            {name.trim() && (
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: color }}>
                  {initials(name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{name.trim()}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: role === "editor" ? "#00BAF2" : "#9CA3AF" }}>{role}</p>
                </div>
              </div>
            )}

            <button onClick={createProfile}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#00BAF2" }}>
              Create Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
