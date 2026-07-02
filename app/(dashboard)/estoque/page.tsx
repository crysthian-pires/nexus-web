"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useSession } from "@/hooks/useSession";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  active: boolean;
  createdAt: string;
}

export default function EstoquePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    loadProducts();
  }, [router]);

  async function loadProducts() {
    try {
      const { data } = await api.get<Product[]>("/products");
      setProducts(data);
    } catch {
      setError("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  function openForm(product?: Product) {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setDescription(product.description || "");
      setPrice(product.price.toString());
      setQuantity(product.quantity.toString());
      setCategory(product.category || "");
    } else {
      setEditingProduct(null);
      setName("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setCategory("");
    }
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name,
      description: description || undefined,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      category: category || undefined,
    };

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
        setSuccess("Produto atualizado com sucesso!");
      } else {
        await api.post("/products", payload);
        setSuccess("Produto criado com sucesso!");
      }
      await loadProducts();
      closeForm();
    } catch (err) {
      setError(getErrorMessage(err, "Erro ao salvar produto."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: number) {
    if (!confirm("Desativar este produto?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Erro ao desativar produto.");
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
          <h2 className="text-white text-2xl font-bold">Estoque</h2>
          <button
            onClick={() => openForm()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition cursor-pointer"
          >
            + Novo produto
          </button>
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
              {editingProduct ? "Editar Produto" : "Novo Produto"}
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

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Para-brisa, Chave, Vidro Lateral"
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
          {products.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              Nenhum produto cadastrado.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Produto
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Categoria
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Preço
                  </th>
                  <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-6 py-4">
                    Qtd
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition"
                  >
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-medium">
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.category ? (
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white text-sm">
                      {product.price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${product.quantity <= 2 ? "text-red-400" : "text-white"}`}
                      >
                        {product.quantity}
                      </span>
                      {product.quantity <= 2 && (
                        <span className="ml-2 text-xs text-red-400">baixo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openForm(product)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
                        >
                          Editar
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeactivate(product.id)}
                            className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer"
                          >
                            Desativar
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
