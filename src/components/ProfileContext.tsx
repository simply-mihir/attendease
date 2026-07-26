"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiFetch } from "@/hooks/useApi";

interface ProfileContextType {
  profiles: any[];
  loading: boolean;
  currentProfile: any | null;
  reloadProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profiles: [],
  loading: true,
  currentProfile: null,
  reloadProfiles: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadProfiles = useCallback(async () => {
    try {
      const res = await apiFetch("/profiles");
      setProfiles(res.profiles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadProfiles();
  }, [reloadProfiles]);

  const currentProfile = profiles.find((p) => p.isCurrent) || profiles[0] || null;

  return (
    <ProfileContext.Provider value={{ profiles, loading, currentProfile, reloadProfiles }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  return useContext(ProfileContext);
}
