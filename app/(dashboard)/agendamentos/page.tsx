"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";

interface Customer {
  id: number;
  name: string;
}

interface Appointment {
  id: number;
  customerId: number;
  customerName: string;
  serviceOrderId?: number;
  description: string;
  scheduledAt: string;
  status: "AGENDADO" | "CONFIRMADO" | "CONCLUIDO" | "CANCELADO";
  estimatedValue?: number;
  notes?: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const statusColors: Record<string, string> = {
  AGENDADO: "bg-yellow-500/10 text-yellow-400",
  CONFIRMADO: "bg-blue-500/10 text-blue-400",
  CONCLUIDO: "bg-green-500/10 text-green-400",
  CANCELADO: "bg-red-500/10 text-red-400",
};

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AgendamentosPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
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
    loadAppointments();
    loadCustomers();
  }, [router]);

  async function loadAppointments(statusFilter?: string) {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const { data } = await api.get<Appointment[]>(`/appointments${params}`);
      setAppointments(data);
    } catch {
      setError("Erro ao carregar agendamentos.");
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
    loadAppointments(value || undefined);
  }

  function openForm(appointment?: Appointment) {
    if (appointment) {
      setEditingAppointment(appointment);
      setCustomerId(appointment.customerId.toString());
      setDescription(appointment.description);
      setScheduledAt(appointment.scheduledAt.slice(0, 16));
      setEstimatedValue(appointment.estimatedValue?.toString() || "");
      setNotes(appointment.notes || "");
      setStatus(appointment.status);
    } else {
      setEditingAppointment(null);
      setCustomerId("");
      setDescription("");
      setScheduledAt("");
      setEstimatedValue("");
      setNotes("");
      setStatus("");
    }
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingAppointment(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingAppointment) {
        await api.patch(`/appointments/${editingAppointment.id}`, {
          description: description || undefined,
          scheduledAt: scheduledAt
            ? new Date(scheduledAt).toISOString()
            : undefined,
          status: status || undefined,
          estimatedValue: estimatedValue
            ? parseFloat(estimatedValue)
            : undefined,
          notes: notes || undefined,
        });
        setSuccess("Agendamento atualizado com sucesso!");
      } else {
        await api.post("/appointments", {
          customerId: parseInt(customerId),
          description,
          scheduledAt: new Date(scheduledAt).toISOString(),
          estimatedValue: estimatedValue
            ? parseFloat(estimatedValue)
            : undefined,
          notes: notes || undefined,
        });
        setSuccess("Agendamento criado com sucesso!");
      }
      await loadAppointments(filterStatus || undefined);
      closeForm();
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar agendamento."));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: number) {
    if (!confirm("Cancelar este agendamento?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CANCELADO" } : a)),
      );
    } catch {
      alert("Erro ao cancelar agendamento.");
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Agendamentos</h2>
          <button
            onClick={() => openForm()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition cursor-pointer"
          >
            + Novo agendamento
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {["", "AGENDADO", "CONFIRMADO", "CONCLUIDO", "CANCELADO"].map((s) => (
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
          ))}
        </div>

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

        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">
              {editingAppointment
                ? `Editar Agendamento #${editingAppointment.id}`
                : "Novo Agendamento"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {!editingAppointment && (
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
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Data e hora
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Valor estimado{" "}
                  <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {editingAppointment && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="AGENDADO">Agendado</option>
                    <option value="CONFIRMADO">Confirmado</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              )}

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

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {appointments.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Data/Hora
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Cliente
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Serviço
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Valor Est.
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition"
                  >
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">
                        {formatDateTime(appointment.scheduledAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-white text-sm">
                      {appointment.customerName}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">
                        {appointment.description}
                      </p>
                      {appointment.notes && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {appointment.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusColors[appointment.status]}`}
                      >
                        {statusLabels[appointment.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white text-sm">
                      {appointment.estimatedValue
                        ? appointment.estimatedValue.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openForm(appointment)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
                        >
                          Editar
                        </button>
                        {appointment.status !== "CANCELADO" &&
                          appointment.status !== "CONCLUIDO" && (
                            <button
                              onClick={() => handleCancel(appointment.id)}
                              className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer"
                            >
                              Cancelar
                            </button>
                          )}
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
