"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
import { FieldLoader } from "@/components/FieldLoader";
import { apiFetch } from "@/hooks/useApi";
import { useSWRFetch, invalidate } from "@/hooks/useSWRFetch";
import {
  Users, Plus, LogIn, Copy, CheckCircle2, Bell, LogOut,
  Loader2, AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { StaggerGrid } from "@/components/StaggerGrid";

interface MemberSubject {
  name: string;
  colorHex: string;
  currentPct: number;
  canSkipCount: number;
  statusColor: "green" | "yellow" | "red";
}

interface GroupMember {
  userId: string;
  name: string;
  image: string | null;
  overallPct: number;
  subjects: MemberSubject[];
}

interface Group {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  memberCount: number;
  members: GroupMember[];
}

export default function GroupsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [nudging, setNudging] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const { data, isLoading: loading } = useSWRFetch<{ groups: Group[] }>("/groups");
  const groups = data?.groups || [];

  async function handleCreate() {
    if (!groupName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify({ name: groupName.trim() }),
      });
      setShowCreate(false);
      setGroupName("");
      setSuccessMsg("Group created!");
      setTimeout(() => setSuccessMsg(""), 3000);
      await invalidate("/groups");
    } catch (err: any) {
      setError(err.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (joinCode.trim().length !== 6) return;
    setJoining(true);
    setError("");
    try {
      const res = await apiFetch("/groups/join", {
        method: "POST",
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });
      setShowJoin(false);
      setJoinCode("");
      setSuccessMsg(`Joined ${res.groupName}!`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await invalidate("/groups");
    } catch (err: any) {
      setError(err.message || "Failed to join group");
    } finally {
      setJoining(false);
    }
  }

  async function handleNudge(groupId: string) {
    setNudging(groupId);
    try {
      await apiFetch(`/groups/${groupId}/nudge`, { method: "POST" });
      setSuccessMsg("Nudge sent! 😏");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setNudging(null);
    }
  }

  async function handleLeave(groupId: string) {
    setLeaving(groupId);
    try {
      await apiFetch(`/groups/${groupId}`, { method: "DELETE" });
      setSuccessMsg("Left the group");
      setTimeout(() => setSuccessMsg(""), 3000);
      await invalidate("/groups");
    } catch (err) {
      console.error(err);
    } finally {
      setLeaving(null);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }


  return (
    <PageTransition direction="left" staggerChildren={false} className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 0ms forwards" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ef476f]/10">
            <Users className="h-6 w-6 text-[#ef476f]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">Friend Groups</h1>
            <p className="text-sm text-[#9ca3af] dark:text-[#6b6b80]">
              Share attendance stats with friends
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
            className="flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all duration-150 cursor-pointer border-[#d63b5f] bg-[#FF2D78] text-white shadow-[0_3px_0_0_#d63b5f] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d63b5f]"
          >
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
            className="flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all duration-150 cursor-pointer border-[#304bc9] bg-[#4361ee] text-white shadow-[0_3px_0_0_#304bc9] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#304bc9]"
          >
            <LogIn className="w-3.5 h-3.5" /> Join
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="rounded-2xl border-2 p-4 flex items-center gap-2 animate-fade-in border-[#05a87e] bg-[#06d6a0]/10 shadow-[0_4px_0_0_#05a87e] mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <CheckCircle2 className="w-5 h-5 text-[#06d6a0]" />
          <p className="text-sm font-bold text-[#06d6a0]">{successMsg}</p>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="rounded-2xl border-2 p-6 space-y-4 animate-fade-in border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a] mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <h3 className="font-extrabold text-lg text-[#1a1a2e] dark:text-white">Create a New Group</h3>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name..."
            className="w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-150 border-gray-200 bg-white text-[#1a1a2e] shadow-[0_3px_0_0_#d1d5db] focus:border-[#4361ee] focus:outline-none focus:ring-4 focus:ring-[#4361ee]/20 dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-white dark:shadow-[0_3px_0_0_#0d0d1a] dark:focus:border-[#4361ee]"
            maxLength={50}
          />
          {error && (
            <p className="text-xs text-[#ef476f] font-bold">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer border-gray-200 bg-white text-[#4a4a5a] shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_3px_0_0_#0d0d1a]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !groupName.trim()}
              className="flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 border-[#d63b5f] bg-[#FF2D78] text-white shadow-[0_3px_0_0_#d63b5f] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d63b5f] disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {creating ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="rounded-2xl border-2 p-6 space-y-4 animate-fade-in border-gray-200 bg-white shadow-[0_6px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:shadow-[0_6px_0_0_#0d0d1a] mb-6" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <h3 className="font-extrabold text-lg text-[#1a1a2e] dark:text-white">Join a Group</h3>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="6-character code"
            className="w-full rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-150 border-gray-200 bg-white text-[#1a1a2e] shadow-[0_3px_0_0_#d1d5db] focus:border-[#4361ee] focus:outline-none focus:ring-4 focus:ring-[#4361ee]/20 dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-white dark:shadow-[0_3px_0_0_#0d0d1a] dark:focus:border-[#4361ee] text-center tracking-[0.4em] font-mono uppercase"
            maxLength={6}
          />
          {error && (
            <p className="text-xs text-[#ef476f] font-bold">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoin(false)}
              className="flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer border-gray-200 bg-white text-[#4a4a5a] shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_3px_0_0_#0d0d1a]"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={joining || joinCode.trim().length !== 6}
              className="flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 border-[#304bc9] bg-[#4361ee] text-white shadow-[0_3px_0_0_#304bc9] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#304bc9] disabled:opacity-50"
            >
              {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              {joining ? "Joining..." : "Join Group"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && !showCreate && !showJoin && (
        <div className="rounded-2xl border border-white/20 p-10 text-center bg-gradient-to-br from-[#0d9488]/25 to-[#0f766e]/20 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(13,148,136,0.15)] dark:border-white/10 dark:from-[#0f766e]/30 dark:to-[#115e59]/25 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
          <div className="w-16 h-16 rounded-2xl bg-[#0f766e]/30 border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-[0_4px_12px_0_rgba(15,118,110,0.3)]">
            <Users className="w-8 h-8 text-[#2dd4bf]" />
          </div>
          <h3 className="text-xl font-extrabold text-[#1a1a2e] dark:text-white mb-2">No Groups Yet</h3>
          <p className="text-[#9ca3af] dark:text-[#6b6b80] text-sm font-bold mb-6 max-w-md mx-auto">
            Create a group to share attendance stats with friends, or join one with a code.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setShowCreate(true); setError(""); }}
              className="flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer border-[#d63b5f] bg-[#FF2D78] text-white shadow-[0_3px_0_0_#d63b5f] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d63b5f]"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
            <button
              onClick={() => { setShowJoin(true); setError(""); }}
              className="flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer border-[#304bc9] bg-[#4361ee] text-white shadow-[0_3px_0_0_#304bc9] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#304bc9]"
            >
              <LogIn className="w-4 h-4" /> Join Group
            </button>
          </div>
        </div>
      )}

      {/* Group cards */}
      <StaggerGrid className="space-y-6" delay={150} staggerDelay={80} animation="fadeSlideUp">
        {loading ? (
          <div className="flex justify-center py-20">
            <FuturisticLoader title="Loading groups..." variant="section" />
          </div>
        ) : groups.map((group) => (
          <div
            key={group.id}
            className="rounded-2xl border border-white/20 overflow-hidden transition-all duration-150 backdrop-blur-2xl bg-gradient-to-br from-[#0d9488]/25 to-[#0f766e]/20 shadow-[0_8px_32px_0_rgba(13,148,136,0.15)] hover:scale-[1.01] dark:border-white/10 dark:from-[#0f766e]/30 dark:to-[#115e59]/25 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
          >
            {/* Group header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-[#1a1a2e] dark:text-white text-lg">{group.name}</h3>
                  <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80] mt-0.5">
                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
                <button
                  onClick={() => copyCode(group.code)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border-2",
                    copiedCode === group.code
                      ? "bg-[#06d6a0]/10 text-[#06d6a0] border-[#05a87e] shadow-[0_2px_0_0_#05a87e] translate-y-[2px]"
                      : "border-gray-200 bg-white text-[#4a4a5a] shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#c4c4d4] dark:shadow-[0_3px_0_0_#0d0d1a]"
                  )}
                >
                  {copiedCode === group.code ? (
                    <><CheckCircle2 className="w-3 h-3 text-[#06d6a0]" /> Copied!</>
                  ) : (
                    <><Copy className="w-3 h-3" /> {group.code}</>
                  )}
                </button>
              </div>
            </div>

            {/* Members */}
            <div className="p-4 space-y-2.5">
              {group.members.map((member) => (
                <div
                  key={member.userId}
                  className="rounded-xl border border-white/10 p-4 flex items-center justify-between bg-white/5 backdrop-blur-md shadow-[0_4px_12px_0_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_0_rgba(0,0,0,0.2)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-[#9b5de5]/10 border-2 border-[#7d32b5] flex items-center justify-center text-[#9b5de5] font-extrabold text-sm shrink-0 shadow-[0_2px_0_0_#7d32b5]">
                      {(member.name || "S").charAt(0).toUpperCase()}
                    </div>

                    {/* Name + overall */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#1a1a2e] dark:text-white truncate">{member.name}</p>
                      <p className="text-xs font-bold text-[#9ca3af] dark:text-[#6b6b80]">
                        Overall:{" "}
                        <span
                          className={clsx(
                            "font-extrabold",
                            member.overallPct >= 75
                              ? "text-[#06d6a0]"
                              : member.overallPct >= 65
                              ? "text-[#ff6b35]"
                              : "text-[#ef476f]"
                          )}
                        >
                          {member.overallPct}%
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Subject health dots */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {member.subjects.slice(0, 6).map((s, j) => (
                      <div
                        key={j}
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                        style={{
                          backgroundColor:
                            s.statusColor === "green"
                              ? "#06d6a0"
                              : s.statusColor === "yellow"
                              ? "#ff6b35"
                              : "#ef476f",
                        }}
                        title={`${s.name}: ${s.currentPct}% (can skip ${s.canSkipCount})`}
                      />
                    ))}
                    {member.subjects.length > 6 && (
                      <span className="text-xs text-text-muted font-black">
                        +{member.subjects.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex items-center justify-between pt-1">
              <button
                onClick={() => handleNudge(group.id)}
                disabled={nudging === group.id}
                className="flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all duration-150 cursor-pointer border-[#d63b5f] bg-[#FF2D78] text-white shadow-[0_3px_0_0_#d63b5f] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d63b5f] disabled:opacity-50"
              >
                {nudging === group.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}
                {nudging === group.id ? "Sending..." : "Nudge 😏"}
              </button>
              <button
                onClick={() => handleLeave(group.id)}
                disabled={leaving === group.id}
                className="flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all duration-150 cursor-pointer border-gray-200 bg-white text-[#ef476f] shadow-[0_3px_0_0_#d1d5db] hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#d1d5db] dark:border-[#2a2a3d] dark:bg-[#141425] dark:text-[#ef476f] dark:shadow-[0_3px_0_0_#0d0d1a] disabled:opacity-50"
              >
                {leaving === group.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                Leave
              </button>
            </div>
          </div>
        ))}
      </StaggerGrid>
    </PageTransition>
  );
}
