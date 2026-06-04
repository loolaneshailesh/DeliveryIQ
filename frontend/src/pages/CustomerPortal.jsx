import { useState } from "react";
import toast from "react-hot-toast";
import { getCustomerOrders, createOrder } from "../api/service";
import { useNavigate } from "react-router-dom";

export default function CustomerPortal() {
  const [customerId, setCustomerId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function loadHistory() {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await getCustomerOrders(Number(customerId));
      setOrders(data);
    } catch {
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  }

  async function reorder(order) {
    try {
      const result = await createOrder({
        customer_id: Number(customerId),
        zone_id: order.zone_id,
        delivery_address: order.delivery_address,
        items: order.items,
      });
      toast.success(`Re-order placed! Order #${result.order_id}`);
      navigate("/track", { state: { orderId: result.order_id } });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Re-order failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Customer Portal</h1>
      <div className="flex gap-2 mb-6">
        <input
          className="border rounded p-2"
          type="number"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />
        <button onClick={loadHistory} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Load History
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />)}
        </div>
      )}

      {!loading && orders.length === 0 && customerId && (
        <p className="text-gray-500">No orders found for this customer</p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.order_id} className="bg-white border rounded p-4 shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Order #{order.order_id}</span>
              <span className={`text-sm capitalize font-medium ${order.status === "delivered" ? "text-green-600" : "text-blue-600"}`}>
                {order.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{order.delivery_address}</p>
            <div className="text-sm text-gray-500 mb-3">
              {order.items.map((item, i) => (
                <span key={i} className="mr-2">{item.item_name} x{item.quantity}</span>
              ))}
            </div>
            <button
              onClick={() => reorder(order)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Re-Order
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
