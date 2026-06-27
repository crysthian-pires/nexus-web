"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";

interface Customer {
  id: number;
  name: string;
}

interface ServiceOrder {
  id: number;
  customerId: number;
  customerName: string;
  description: string;
  status: "PENDENTE" | "EM_EXECUCAO" | "FINALIZADO" | "CANCELADO";
  totalValue?: number;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_EXECUCAO: "Em Execução",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const statusColors: Record<string, string> = {
  PENDENTE: "bg-yellow-500/10 text-yellow-400",
  EM_EXECUCAO: "bg-blue-500/10 text-blue-400",
  FINALIZADO: "bg-green-500/10 text-green-400",
  CANCELADO: "bg-red-500/10 text-red-400",
};

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function OrdensPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

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
    loadOrders();
    loadCustomers();
  }, [router]);

  async function loadOrders(statusFilter?: string) {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const { data } = await api.get<ServiceOrder[]>(
        `/service-orders${params}`,
      );
      setOrders(data);
    } catch {
      setError("Erro ao carregar ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const { data } = await api.get<Customer[]>("/customers");
      setCustomers(data);
    } catch {
      console.error("Erro ao carregar clientes.");
    }
  }

  function handleFilterStatus(value: string) {
    setFilterStatus(value);
    loadOrders(value || undefined);
  }

  function openForm(order?: ServiceOrder) {
    if (order) {
      setEditingOrder(order);
      setCustomerId(order.customerId.toString());
      setDescription(order.description);
      setTotalValue(order.totalValue?.toString() || "");
      setNotes(order.notes || "");
      setStatus(order.status);
    } else {
      setEditingOrder(null);
      setCustomerId("");
      setDescription("");
      setTotalValue("");
      setNotes("");
      setStatus("");
    }
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingOrder(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingOrder) {
        await api.patch(`/service-orders/${editingOrder.id}`, {
          description: description || undefined,
          status: status || undefined,
          totalValue: totalValue ? parseFloat(totalValue) : undefined,
          notes: notes || undefined,
        });
        setSuccess("OS atualizada com sucesso!");
      } else {
        await api.post("/service-orders", {
          customerId: parseInt(customerId),
          description,
          totalValue: totalValue ? parseFloat(totalValue) : undefined,
          notes: notes || undefined,
        });
        setSuccess("OS criada com sucesso!");
      }
      await loadOrders(filterStatus || undefined);
      closeForm();
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao salvar OS.");
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
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Título */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Ordens de Serviço</h2>
          <button
            onClick={() => openForm()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition cursor-pointer"
          >
            + Nova OS
          </button>
        </div>

        {/* Filtro por status */}
        <div className="flex gap-2 mb-6">
          {["", "PENDENTE", "EM_EXECUCAO", "FINALIZADO", "CANCELADO"].map(
            (s) => (
              <button
                key={s}
                onClick={() => handleFilterStatus(s)}
                className={`text-sm px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterStatus === s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {s === "" ? "Todos" : statusLabels[s]}
              </button>
            ),
          )}
        </div>

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
              {editingOrder ? `Editar OS #${editingOrder.id}` : "Nova OS"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {!editingOrder && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Cliente
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Descrição do serviço
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                />
              </div>

              {editingOrder && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_EXECUCAO">Em Execução</option>
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Valor total <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="col-span-2">
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

        {/* Lista */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              Nenhuma ordem de serviço encontrada.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    OS
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Cliente
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Descrição
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Valor
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition"
                  >
                    <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                      #{order.id.toString().padStart(4, "0")}
                    </td>
                    <td className="px-6 py-4 text-white text-sm">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{order.description}</p>
                      {order.notes && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {order.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white text-sm">
                      {order.totalValue
                        ? order.totalValue.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openForm(order)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
                      >
                        Editar
                      </button>
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
