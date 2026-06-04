import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getZones, createOrder } from "../api/service";

export default function OrderPlacement() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    zone_id: "",
    delivery_address: "",
    items: [{ item_name: "", quantity: 1 }],
  });

  useEffect(() => {
    getZones().then(setZones).catch(() => toast.error("Failed to load zones"));
  }, []);

  function updateItem(index, field, value) {
    const updated = [...form.items];
    updated[index][field] = field === "quantity" ? Number(value) : value;
    setForm({ ...form, items: updated });
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { item_name: "", quantity: 1 }] });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createOrder({
        ...form,
        customer_id: Number(form.customer_id),
        zone_id: Number(form.zone_id),
      });
      toast.success(`Order #${result.order_id} placed! ETA: ${new Date(result.estimated_delivery_at).toLocaleTimeString()}`);
      setForm({ customer_id: "", zone_id: "", delivery_address: "", items: [{ item_name: "", quantity: 1 }] });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to place order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Place an Order</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Customer ID</label>
          <input
            className="border rounded w-full p-2"
            type="number"
            value={form.customer_id}
            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Delivery Zone</label>
          <select
            className="border rounded w-full p-2"
            value={form.zone_id}
            onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
            required
          >
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.zone_id} value={z.zone_id}>
                {z.zone_name} (~{z.avg_delivery_minutes} mins)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Delivery Address</label>
          <input
            className="border rounded w-full p-2"
            value={form.delivery_address}
            onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Items</label>
          {form.items.map((item, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                className="border rounded flex-1 p-2"
                placeholder="Item name"
                value={item.item_name}
                onChange={(e) => updateItem(i, "item_name", e.target.value)}
                required
              />
              <input
                className="border rounded w-20 p-2"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", e.target.value)}
              />
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-blue-600 text-sm">
            + Add item
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-pulse">Placing order...</span>
          ) : (
            "Place Order"
          )}
        </button>
      </form>
    </div>
  );
}
