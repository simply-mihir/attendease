"use client";
import { useAutoResubscribe } from "@/hooks/useNotifications";

export function AutoResubscribe() {
  useAutoResubscribe();
  return null;
}
