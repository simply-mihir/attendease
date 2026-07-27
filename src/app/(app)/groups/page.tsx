"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/hooks/useApi";
import {
  Users, Plus, LogIn, Copy, CheckCircle2, Bell, LogOut,
  Loader2, AlertTriangle,
} from "lucide-react";
import clsx from "clsx";

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
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadGroups = useCallback(async () => {
    try {
      const data = await apiFetch("/groups");
      setGroups(data.groups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

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
      await loadGroups();
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
      await loadGroups();
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
      await loadGroups();
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
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
          <div className="w-40 h-8 rounded-lg bg-white/10 animate-pulse" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="glass rounded-2xl p-6 h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-gradient">Friend Groups</span>
          </h1>
          <p className="text-text-muted text-sm mt-1 ml-[52px]">
            Share attendance stats with friends
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
            className="btn-gradient px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
            className="btn-gradient-cyan px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" /> Join
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="glass rounded-2xl p-3 border-green-500/30 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <p className="text-sm font-bold text-green-400">{successMsg}</p>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in">
          <h3 className="font-black text-text">Create a New Group</h3>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name..."
            className="input-glass w-full py-2.5 rounded-xl text-sm"
            maxLength={50}
          />
          {error && (
            <p className="text-xs text-red-400 font-bold">{error}</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1 py-2.5 text-sm">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !groupName.trim()}
              className="btn-gradient flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {creating ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in">
          <h3 className="font-black text-text">Join a Group</h3>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="6-character code"
            className="input-glass w-full py-2.5 rounded-xl text-sm text-center tracking-[0.4em] font-mono font-black uppercase"
            maxLength={6}
          />
          {error && (
            <p className="text-xs text-red-400 font-bold">{error}</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowJoin(false)} className="btn-ghost flex-1 py-2.5 text-sm">
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={joining || joinCode.trim().length !== 6}
              className="btn-gradient-cyan flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              {joining ? "Joining..." : "Join Group"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && !showCreate && !showJoin && (
        <div className="glass rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-text mb-2">No Groups Yet</h3>
          <p className="text-text-muted text-sm mb-6">
            Create a group to share attendance stats with friends, or join one with a code.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setShowCreate(true); setError(""); }}
              className="btn-gradient px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
            <button
              onClick={() => { setShowJoin(true); setError(""); }}
              className="btn-gradient-cyan px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Join Group
            </button>
          </div>
        </div>
      )}

      {/* Group cards */}
      {groups.map((group, i) => (
        <div
          key={group.id}
          className="glass rounded-2xl overflow-hidden"
          style={{ animation: `fade-in 0.3s ease-out ${0.05 * i}s both` }}
        >
          {/* Group header */}
          <div className="p-5 border-b-2 border-border-heavy">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-text text-lg">{group.name}</h3>
                <p className="text-xs text-text-muted">
                  {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                </p>
              </div>
              <button
                onClick={() => copyCode(group.code)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition border-2 border-border-heavy",
                  copiedCode === group.code
                    ? "bg-green-500/10 text-green-400"
                    : "bg-surface-3 text-text-secondary hover:bg-surface-3/80"
                )}
              >
                {copiedCode === group.code ? (
                  <><CheckCircle2 className="w-3 h-3" /> Copied!</>
                ) : (
                  <><Copy className="w-3 h-3" /> {group.code}</>
                )}
              </button>
            </div>
          </div>

          {/* Members */}
          <div className="p-4 space-y-3">
            {group.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 p-3 bg-surface-3 rounded-xl border-2 border-border-heavy"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shrink-0 border-2 border-border-heavy">
                  {(member.name || "S").charAt(0).toUpperCase()}
                </div>

                {/* Name + overall */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-text truncate">{member.name}</p>
                  <p className="text-xs text-text-muted">
                    Overall:{" "}
                    <span
                      className={clsx(
                        "font-black",
                        member.overallPct >= 75
                          ? "text-green-400"
                          : member.overallPct >= 65
                          ? "text-yellow-400"
                          : "text-red-400"
                      )}
                    >
                      {member.overallPct}%
                    </span>
                  </p>
                </div>

                {/* Subject health dots */}
                <div className="flex items-center gap-1 shrink-0">
                  {member.subjects.slice(0, 6).map((s, j) => (
                    <div
                      key={j}
                      className="w-3 h-3 rounded-full border border-border-heavy"
                      style={{
                        backgroundColor:
                          s.statusColor === "green"
                            ? "#22c55e"
                            : s.statusColor === "yellow"
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                      title={`${s.name}: ${s.currentPct}% (can skip ${s.canSkipCount})`}
                    />
                  ))}
                  {member.subjects.length > 6 && (
                    <span className="text-xs text-text-muted font-bold">
                      +{member.subjects.length - 6}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <button
              onClick={() => handleNudge(group.id)}
              disabled={nudging === group.id}
              className="btn-gradient px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-red-400 hover:bg-red-500/10 transition"
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
    </div>
  );
}
