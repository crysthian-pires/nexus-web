"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { userService } from "@/services/user.service";
import { User } from "@/types/user";

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

    userService
      .getMe()
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

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
        <h2 className="text-white text-2xl font-bold mb-2">
          Olá, {user?.name?.split(" ")[0]}
        </h2>
        <p className="text-gray-400 text-sm">
          Bem-vindo ao Nexus. Use o menu para acessar os módulos.
        </p>
      </main>
    </div>
  );
}
