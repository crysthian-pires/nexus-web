"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { User } from "@/types/user";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = parseJwt(token);
    if (!payload) {
      router.push("/login");
      return;
    }

    userService
      .getMe(payload.id)
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  async function handleLogout() {
    await authService.logout();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Nexus</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Olá, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-white text-2xl font-bold mb-6">Meu Perfil</h2>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{user?.name}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Telefone
              </p>
              <p className="text-white text-sm">
                {user?.phone || "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Nascimento
              </p>
              <p className="text-white text-sm">
                {user?.birthDate || "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Status
              </p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${user?.active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
              >
                {user?.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Membro desde
              </p>
              <p className="text-white text-sm">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={() => router.push("/perfil")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg py-2.5 transition cursor-pointer"
            >
              Editar perfil
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
