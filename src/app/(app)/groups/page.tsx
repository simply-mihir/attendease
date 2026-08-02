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
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-text tracking-tight">
            <div className="w-11 h-11 rounded-2xl bg-[#ef476f] border-2 border-[#cc1a42] flex items-center justify-center shadow-[0_3px_0_0_#cc1a42]">
              <Users className="w-5 h-5 text-white" />
            </div>
            Friend Groups
          </h1>
          <p className="text-text-muted text-sm font-bold mt-1 ml-[56px]">
            Share attendance stats with friends
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
            className="btn-3d-danger px-4 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
            className="btn-3d-secondary px-4 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" /> Join
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="card-3d p-3.5 border-[#06d6a0] shadow-[0_4px_0_0_#06d6a0] bg-[#06d6a0]/10 flex items-center gap-2 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <CheckCircle2 className="w-4 h-4 text-[#06d6a0]" />
          <p className="text-sm font-black text-[#06d6a0]">{successMsg}</p>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="card-3d p-6 space-y-4 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <h3 className="font-black text-base text-text">Create a New Group</h3>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name..."
            className="input-3d"
            maxLength={50}
          />
          {error && (
            <p className="text-xs text-[#ef476f] font-bold">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="btn-3d-secondary flex-1 py-2.5 font-black text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !groupName.trim()}
              className="btn-3d-danger flex-1 py-2.5 font-black text-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {creating ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="card-3d p-6 space-y-4 animate-fade-in" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 50ms forwards" }}>
          <h3 className="font-black text-base text-text">Join a Group</h3>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="6-character code"
            className="input-3d text-center tracking-[0.4em] font-mono uppercase"
            maxLength={6}
          />
          {error && (
            <p className="text-xs text-[#ef476f] font-bold">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoin(false)}
              className="btn-3d-secondary flex-1 py-2.5 font-black text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={joining || joinCode.trim().length !== 6}
              className="btn-3d-primary flex-1 py-2.5 font-black text-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              {joining ? "Joining..." : "Join Group"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && !showCreate && !showJoin && (
        <div className="card-3d p-10 text-center" style={{ opacity: 0, animation: "fadeSlideUp 0.5s ease-out 100ms forwards" }}>
          <div className="w-16 h-16 rounded-2xl bg-[#ef476f] border-2 border-[#cc1a42] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_0_0_#cc1a42]">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-black text-text mb-2">No Groups Yet</h3>
          <p className="text-text-muted text-sm font-bold mb-6 max-w-md mx-auto">
            Create a group to share attendance stats with friends, or join one with a code.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setShowCreate(true); setError(""); }}
              className="btn-3d-danger px-5 py-2.5 text-sm font-black flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
            <button
              onClick={() => { setShowJoin(true); setError(""); }}
              className="btn-3d-primary px-5 py-2.5 text-sm font-black flex items-center gap-2 cursor-pointer"
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
            className="card-3d overflow-hidden transition-all"
          >
            {/* Group header */}
            <div className="p-5 border-b-2 border-gray-100 dark:border-[#2a2a3d]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-text text-lg">{group.name}</h3>
                  <p className="text-xs font-bold text-text-muted mt-0.5">
                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
                <button
                  onClick={() => copyCode(group.code)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border-2",
                    copiedCode === group.code
                      ? "bg-[#06d6a0]/15 text-[#06d6a0] border-[#06d6a0] shadow-[0_2px_0_0_#06d6a0]"
                      : "btn-3d-secondary"
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
                  className="flex items-center gap-3 p-3.5 bg-gray-50/80 dark:bg-[#141425] rounded-2xl border-2 border-gray-200 dark:border-[#2a2a3d] shadow-[0_2px_0_0_rgba(0,0,0,0.06)]"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-[#7b2cbf] border-2 border-[#5a189a] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-[0_2px_0_0_#5a189a]">
                    {(member.name || "S").charAt(0).toUpperCase()}
                  </div>

                  {/* Name + overall */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-text truncate">{member.name}</p>
                    <p className="text-xs font-bold text-text-muted">
                      Overall:{" "}
                      <span
                        className={clsx(
                          "font-black",
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
                className="btn-3d-danger px-4 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
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
                className="btn-3d-secondary flex items-center gap-1.5 px-3 py-2 text-xs font-black hover:text-[#ef476f] cursor-pointer"
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
