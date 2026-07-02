"use client";

import { useSyncExternalStore } from "react";
import Cookies from "js-cookie";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export interface SessionInfo {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userName: string;
  userEmail: string;
}

const emptySession: SessionInfo = {
  isAuthenticated: false,
  isAdmin: false,
  userName: "",
  userEmail: "",
};

let cachedToken: string | undefined;
let cachedSnapshot: SessionInfo = emptySession;

function getSnapshot(): SessionInfo {
  const token = Cookies.get("accessToken");

  if (token === cachedToken) {
    return cachedSnapshot;
  }
  cachedToken = token;

  if (!token) {
    cachedSnapshot = emptySession;
    return cachedSnapshot;
  }

  const payload = parseJwt(token);
  if (!payload) {
    cachedSnapshot = emptySession;
    return cachedSnapshot;
  }

  cachedSnapshot = {
    isAuthenticated: true,
    isAdmin: payload.role === "ADMIN",
    userName: payload.name || "",
    userEmail: payload.sub || "",
  };
  return cachedSnapshot;
}

function getServerSnapshot(): SessionInfo {
  return emptySession;
}

function subscribe() {
  return () => {};
}

export function useSession(): SessionInfo {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
