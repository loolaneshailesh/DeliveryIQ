import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getAgents, getZones, assignAgent, suggestAgent } from "../api/service";
import axios from "axios";

export default function OperationsDashboard() {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState({});
  const [suggestions, setSuggestions] = useState({});

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await axios.get("/api/orders/status/all").catch(() => ({ data: [] }));
      const allRes = await axios.get("/api/analytics/summary");
      const statuses = Object.keys(allRes.data.by_status || {});
      const all = [];
      for (const s of ["placed", "assigned", "picked_up", "in_transit"]) {
        try {
          const r = await axios.get(`/api/orders/status/1`);
          break;
        } catch {}
      }
      const ordersRes = await axios.get("/api/zones").then(async (r) => {
        const allOrders = [];
        for (const zone of r.data) {
          try {
            const oz = await axios.get(`/api/orders/status/${zone.zone_id}`);
            allOrders.push(...oz.data);
          } catch {}
        }
        return allOrders;
      });
      setOrders(ordersRes);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    getAgents().then(setAgents).catch(() => toast.error("Failed to load agents"));
  }, []);

  async function handleAssign(orderId) {
    const agentId = selectedAgent[orderId];
    if (!agentId) return toast.error("Select an agent");
    try {
      await assignAgent(orderId, Number(agentId));
      toast.success("Agent assigned!");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Assignment failed");
    }
  }

  async function handleSuggest(orderId) {
    try {
      const data = await suggestAgent(orderId);
      setSuggestions({ ...suggestions, [orderId]: data.suggested_agent });
      if (data.suggested_agent) {
        setSelectedAgent({ ...selectedAgent, [orderId]: data.suggested_agent.agent_id });
        toast.success(`Suggested: ${data.suggested_agent.name}`);
      } else {
        toast("No available agents in this zone");
      }
    } catch {
      toast.error("Failed to get suggestion");
    }
  }

  const unassigned = orders.filter((o) => o.status === "placed");
  const active = orders.filter((o) => o.status !== "placed" && o.status !== "delivered");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Operations Dashboard</h1>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />)}
        </div>
      )}

      {!loading && (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-red-600">Unassigned Orders ({unassigned.length})</h2>
            {unassigned.length === 0 && <p className="text-gray-500">No unassigned orders</p>}
            {unassigned.map((order) => (
              <div key={order.order_id} className="bg-white border rounded p-4 mb-3 shadow-sm">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Order #{order.order_id}</span>
                  <span className="text-sm text-orange-600">{order.status}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{order.delivery_address}</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    className="border rounded p-1 text-sm"
                    value={selectedAgent[order.order_id] || ""}
                    onChange={(e) => setSelectedAgent({ ...selectedAgent, [order.order_id]: e.target.value })}
                  >
                    <option value="">Select agent</option>
                    {agents.map((a) => (
                      <option
                        key={a.agent_id}
                        value={a.agent_id}
                        disabled={a.availability_status !== "available"}
                      >
                        {a.name} - {a.zone_name} ({a.availability_status})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSuggest(order.order_id)}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                  >
                    Suggest Agent
                  </button>
                  <button
                    onClick={() => handleAssign(order.order_id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Assign
                  </button>
                </div>
                {suggestions[order.order_id] && (
                  <p className="text-xs text-purple-600 mt-1">
                    Suggested: {suggestions[order.order_id].name} ({suggestions[order.order_id].active_assignments} active)
                  </p>
                )}
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-blue-600">Active Orders ({active.length})</h2>
            {active.length === 0 && <p className="text-gray-500">No active orders</p>}
            {active.map((order) => (
              <div key={order.order_id} className="bg-white border rounded p-4 mb-3 shadow-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Order #{order.order_id}</span>
                  <span className="text-sm capitalize text-blue-600">{order.status.replace("_", " ")}</span>
                </div>
                <p className="text-sm text-gray-600">{order.delivery_address}</p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
