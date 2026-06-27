"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { User } from "@/types/user";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = parseJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    api
      .get<User[]>("/users")
      .then(({ data }) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar usuários.");
        setLoading(false);
      });
  }, [router]);

  async function handleDeactivate(id: number) {
    if (!confirm("Desativar este usuário?")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, active: false } : u)),
      );
    } catch {
      alert("Erro ao desativar usuário.");
    }
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
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-400 hover:text-white transition cursor-pointer"
        >
          ← Voltar
        </button>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-white text-2xl font-bold mb-6">
          Gerenciar Usuários
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                  Nome
                </th>
                <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                  E-mail
                </th>
                <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                  Status
                </th>
                <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                  Membro desde
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white text-sm">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${user.active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    {user.active && (
                      <button
                        onClick={() => handleDeactivate(user.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer"
                      >
                        Desativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
