"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { User } from "@/types/user";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // campos do form de edição
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    userService
      .getMe()
      .then((data) => {
        setUser(data);
        hydrateForm(data);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  function hydrateForm(data: User) {
    setName(data.name || "");
    setEmail(data.email || "");
    setPhone(data.phone || "");
    setBirthDate(data.birthDate || "");
  }

  function openEdit() {
    if (user) hydrateForm(user);
    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEdit() {
    if (user) hydrateForm(user);
    setEditing(false);
  }

  async function handleLogout() {
    await authService.logout();
    router.push("/login");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const updatePayload: { name?: string; email?: string } = { name };

      if (user && email !== user.email) {
        updatePayload.email = email;
      }

      const updateResult = await userService.updateUser(updatePayload);
      if (updateResult.token) {
        Cookies.set("accessToken", updateResult.token);
      }

      await userService.updateProfile({
        phone: phone || undefined,
        birthDate: birthDate || undefined,
      });

      const refreshed = await userService.getMe();
      setUser(refreshed);
      hydrateForm(refreshed);
      setSuccess("Perfil atualizado com sucesso!");
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
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
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-white text-2xl font-bold mb-6">
          {editing ? "Editar Perfil" : "Meu Perfil"}
        </h2>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {!editing ? (
            <>
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

              {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
                  {success}
                </div>
              )}

              {user?.role === "ADMIN" && (
                <button
                  onClick={() => router.push("/admin")}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg py-2.5 transition cursor-pointer"
                >
                  Gerenciar usuários
                </button>
              )}

              <button
                onClick={openEdit}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg py-2.5 transition cursor-pointer"
              >
                Editar perfil
              </button>

              <div className="pt-4 border-t border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 font-medium rounded-lg py-2.5 transition cursor-pointer"
                >
                  Sair
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Telefone <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+5511999998888"
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Data de nascimento{" "}
                  <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-lg py-2.5 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg py-2.5 transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
