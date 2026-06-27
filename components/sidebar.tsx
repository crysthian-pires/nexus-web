"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { authService } from "@/services/auth.service";
import { useEffect, useState } from "react";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

interface NavItem {
  label: string;
  href?: string;
  icon: string;
  soon?: boolean;
  adminOnly?: boolean;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "🏠",
  },
  {
    label: "Perfil",
    icon: "👤",
    children: [
      { label: "Editar Perfil", href: "/perfil", icon: "✏️" },
      { label: "Usuários", href: "/admin", icon: "👥", adminOnly: true },
    ],
  },
  {
    label: "Estoque",
    href: "/estoque",
    icon: "📦",
  },
  {
    label: "Ordens de Serviço",
    icon: "🔧",
    soon: true,
  },
  {
    label: "Clientes",
    icon: "👥",
    soon: true,
  },
  {
    label: "Agendamentos",
    icon: "📅",
    soon: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = Cookies.get("accessToken");
    const payload = token ? parseJwt(token) : null;
    setIsAdmin(payload?.role === "ADMIN");
    setUserName(payload?.name || "");
    setUserEmail(payload?.sub || "");
    setMounted(true);
  }, []);

  async function handleLogout() {
    await authService.logout();
    router.push("/login");
  }

  if (!mounted) return null;

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-white font-bold text-xl">Nexus</h1>
        <p className="text-gray-500 text-xs mt-0.5">Sistema de Gestão</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          if (item.children) {
            return (
              <div key={item.label}>
                <div className="flex items-center gap-2 px-3 py-2 text-gray-500 text-xs uppercase tracking-wide font-medium mt-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <div className="ml-2 space-y-1">
                  {item.children.map((child) => {
                    if (child.adminOnly && !isAdmin) return null;
                    const isActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href!}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                        }`}
                      >
                        <span>{child.icon}</span>
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (item.soon) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                  em breve
                </span>
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 py-2">
          <p className="text-gray-500 text-xs">{userName}</p>
          <p className="text-gray-600 text-xs">{userEmail}</p>
        </div>
      </div>
    </aside>
  );
}
