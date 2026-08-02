"use client";
import { useState } from "react";
import { FuturisticLoader } from "@/components/FuturisticLoader";
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

  if (loading) {
    return <FuturisticLoader variant="section" title="Loading groups" Icon={Users} />;
  }

  return (
    <PageTransition direction="left" staggerChildren={false} className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4" style={{ opacity: 0, animation: "fadeSlideLeft 0.5s ease-out 0ms forwards" }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            Friend Groups
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-[52px]">
            Share attendance stats with friends
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center gap-1.5 shadow-md shadow-pink-500/20 hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-cyan-500/20 hover:shadow-lg transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" /> Join
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="rounded-2xl p-3.5 bg-teal-50 border border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/20 flex items-center gap-2 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <p className="text-sm font-bold text-teal-700 dark:text-teal-300">{successMsg}</p>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="rounded-3xl p-6 bg-white border border-gray-200/60 shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-4 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Create a New Group</h3>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name..."
            className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            maxLength={50}
          />
          {error && (
            <p className="text-xs text-rose-500 font-bold">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !groupName.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-md shadow-pink-500/20 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {creating ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="rounded-3xl p-6 bg-white border border-gray-200/60 shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl space-y-4 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Join a Group</h3>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="6-character code"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm text-center tracking-[0.4em] font-mono font-black uppercase border border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            maxLength={6}
          />
          {error && (
            <p className="text-xs text-rose-500 font-bold">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoin(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={joining || joinCode.trim().length !== 6}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              {joining ? "Joining..." : "Join Group"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && !showCreate && !showJoin && (
        <div className="rounded-3xl p-10 text-center bg-white border border-gray-200/60 shadow-sm dark:bg-white/[0.04] dark:border-white/[0.08]" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Groups Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Create a group to share attendance stats with friends, or join one with a code.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setShowCreate(true); setError(""); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center gap-2 shadow-md shadow-pink-500/20 hover:shadow-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
            <button
              onClick={() => { setShowJoin(true); setError(""); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center gap-2 shadow-md shadow-cyan-500/20 hover:shadow-lg transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Join Group
            </button>
          </div>
        </div>
      )}

      {/* Group cards */}
      <StaggerGrid className="space-y-6" delay={150} staggerDelay={80} animation="fadeSlideUp">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-3xl bg-white border border-gray-200/60 shadow-sm hover:shadow-md dark:bg-white/[0.04] dark:border-white/[0.08] dark:backdrop-blur-xl overflow-hidden transition-all"
          >
            {/* Group header */}
            <div className="p-5 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">{group.name}</h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
                <button
                  onClick={() => copyCode(group.code)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border",
                    copiedCode === group.code
                      ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/30"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/10"
                  )}
                >
                  {copiedCode === group.code ? (
                    <><CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400" /> Copied!</>
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
                  className="flex items-center gap-3 p-3.5 bg-gray-50/70 dark:bg-white/[0.03] rounded-2xl border border-gray-200/60 dark:border-white/5"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm">
                    {(member.name || "S").charAt(0).toUpperCase()}
                  </div>

                  {/* Name + overall */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{member.name}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Overall:{" "}
                      <span
                        className={clsx(
                          "font-bold",
                          member.overallPct >= 75
                            ? "text-teal-600 dark:text-teal-400"
                            : member.overallPct >= 65
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-500 dark:text-rose-400"
                        )}
                      >
                        {member.overallPct}%
                      </span>
                    </p>
                  </div>

                  {/* Subject health dots */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {member.subjects.slice(0, 6).map((s, j) => (
                      <div
                        key={j}
                        className="w-3 h-3 rounded-full border border-white/20 shadow-xs"
                        style={{
                          backgroundColor:
                            s.statusColor === "green"
                              ? "#0d9488"
                              : s.statusColor === "yellow"
                              ? "#f59e0b"
                              : "#f43f5e",
                        }}
                        title={`${s.name}: ${s.currentPct}% (can skip ${s.canSkipCount})`}
                      />
                    ))}
                    {member.subjects.length > 6 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center gap-1.5 shadow-md shadow-pink-500/20 hover:shadow-lg transition cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
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
