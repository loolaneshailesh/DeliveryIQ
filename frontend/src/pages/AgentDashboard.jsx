import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getAgents, getAgentOrders, updateAgentAvailability, updateOrderStatus } from "../api/service";

export default function AgentDashboard() {
  const [agentId, setAgentId] = useState("");
  const [agent, setAgent] = useState(null);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusInputs, setStatusInputs] = useState({});

  useEffect(() => {
    getAgents().then(setAgents).catch(() => toast.error("Failed to load agents"));
  }, []);

  async function loadAgent() {
    if (!agentId) return;
    setLoading(true);
    try {
      const found = agents.find((a) => a.agent_id === Number(agentId));
      setAgent(found || null);
      const data = await getAgentOrders(Number(agentId));
      setOrders(data);
    } catch {
      toast.error("Failed to load agent data");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability(status) {
    try {
      await updateAgentAvailability(Number(agentId), status);
      setAgent({ ...agent, availability_status: status });
      toast.success(`Status set to ${status}`);
    } catch {
      toast.error("Failed to update availability");
    }
  }

  async function updateStatus(orderId) {
    const { status, note } = statusInputs[orderId] || {};
    if (!status) return toast.error("Select a status");
    try {
      await updateOrderStatus(orderId, { status, note, agent_id: Number(agentId) });
      toast.success("Status updated");
      loadAgent();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update status");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>
      <div className="flex gap-2 mb-6">
        <select
          className="border rounded p-2"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        >
          <option value="">Select agent</option>
          {agents.map((a) => (
            <option key={a.agent_id} value={a.agent_id}>
              {a.name} ({a.availability_status})
            </option>
          ))}
        </select>
        <button onClick={loadAgent} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Load
        </button>
      </div>

      {loading && <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />}

      {agent && (
        <div className="space-y-6">
          <div className="bg-white border rounded p-4 shadow-sm">
            <h2 className="font-semibold text-lg">{agent.name}</h2>
            <p className="text-sm text-gray-500">Zone: {agent.zone_name} | Status: <span className="font-medium capitalize">{agent.availability_status}</span></p>
            <div className="flex gap-2 mt-3">
              {["available", "busy", "offline"].map((s) => (
                <button
                  key={s}
                  onClick={() => toggleAvailability(s)}
                  className={`px-3 py-1 rounded text-sm border ${agent.availability_status === s ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Assigned Orders</h3>
            {orders.length === 0 && <p className="text-gray-500">No assigned orders</p>}
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white border rounded p-4 mb-3 shadow-sm">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Order #{order.order_id}</span>
                  <span className="text-sm capitalize text-blue-600">{order.status}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{order.delivery_address}</p>
                <div className="flex gap-2 flex-wrap">
                  <select
                    className="border rounded p-1 text-sm"
                    value={statusInputs[order.order_id]?.status || ""}
                    onChange={(e) =>
                      setStatusInputs({ ...statusInputs, [order.order_id]: { ...statusInputs[order.order_id], status: e.target.value } })
                    }
                  >
                    <option value="">Update status</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <input
                    className="border rounded p-1 text-sm flex-1"
                    placeholder="Note (optional)"
                    value={statusInputs[order.order_id]?.note || ""}
                    onChange={(e) =>
                      setStatusInputs({ ...statusInputs, [order.order_id]: { ...statusInputs[order.order_id], note: e.target.value } })
                    }
                  />
                  <button
                    onClick={() => updateStatus(order.order_id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
