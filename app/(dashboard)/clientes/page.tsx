"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function ClientesPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [notes, setNotes] = useState("");

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
    loadCustomers();
  }, [router]);

  async function loadCustomers(searchTerm?: string) {
    try {
      const params = searchTerm ? `?search=${searchTerm}` : "";
      const { data } = await api.get<Customer[]>(`/customers${params}`);
      setCustomers(data);
    } catch {
      setError("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCustomers(search);
  }

  function openForm(customer?: Customer) {
    if (customer) {
      setEditingCustomer(customer);
      setName(customer.name);
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
      setDocument(customer.document || "");
      setNotes(customer.notes || "");
    } else {
      setEditingCustomer(null);
      setName("");
      setEmail("");
      setPhone("");
      setDocument("");
      setNotes("");
    }
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingCustomer(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name,
      email: email || undefined,
      phone: phone || undefined,
      document: document || undefined,
      notes: notes || undefined,
    };

    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, payload);
        setSuccess("Cliente atualizado com sucesso!");
      } else {
        await api.post("/customers", payload);
        setSuccess("Cliente criado com sucesso!");
      }
      await loadCustomers();
      closeForm();
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao salvar cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: number) {
    if (!confirm("Desativar este cliente?")) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Erro ao desativar cliente.");
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
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Título */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Clientes</h2>
          <button
            onClick={() => openForm()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition cursor-pointer"
          >
            + Novo cliente
          </button>
        </div>

        {/* Busca */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            type="submit"
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition cursor-pointer"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                loadCustomers();
              }}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg px-4 py-2.5 transition cursor-pointer"
            >
              Limpar
            </button>
          )}
        </form>

        {/* Feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-6">
            {success}
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">
              {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  E-mail <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  CPF/CNPJ <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Observações <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-lg px-6 py-2.5 transition cursor-pointer"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg px-6 py-2.5 transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {customers.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Nome
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Contato
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Documento
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Desde
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {customer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {customer.name}
                          </p>
                          {customer.notes && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              {customer.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-400 text-sm">
                        {customer.email || "—"}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {customer.phone || ""}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {customer.document || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openForm(customer)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeactivate(customer.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer"
                        >
                          Desativar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
