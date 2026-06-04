import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { getOrder, submitFeedback } from "../api/service";

const STATUS_STEPS = ["placed", "assigned", "picked_up", "in_transit", "delivered"];

export default function OrderTracker() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comments: "" });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const wsRef = useRef(null);

  async function fetchOrder(id) {
    setLoading(true);
    try {
      const data = await getOrder(id);
      setOrder(data);
    } catch {
      toast.error("Order not found");
    } finally {
      setLoading(false);
    }
  }

  function connectWebSocket(id) {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`ws://localhost:8000/ws/orders/${id}`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      toast.success(`Status update: ${msg.status}`);
      fetchOrder(id);
    };
    ws.onerror = () => toast.error("WebSocket connection failed");
    wsRef.current = ws;
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!orderId) return;
    fetchOrder(orderId);
    connectWebSocket(orderId);
  }

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  async function handleFeedback(e) {
    e.preventDefault();
    try {
      await submitFeedback({ order_id: Number(orderId), ...feedback, rating: Number(feedback.rating) });
      toast.success("Feedback submitted!");
      setFeedbackSent(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit feedback");
    }
  }

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Track Your Order</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          className="border rounded p-2 flex-1 max-w-xs"
          placeholder="Enter Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Track</button>
      </form>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse w-64" />
          ))}
        </div>
      )}

      {order && !loading && (
        <div className="space-y-6">
          <div className="bg-white border rounded p-4 shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Order #{order.order_id}</span>
              <span className="text-sm text-gray-500">
                ETA: {order.estimated_delivery_at ? new Date(order.estimated_delivery_at).toLocaleTimeString() : "N/A"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{order.delivery_address}</p>
            {order.assigned_agent && <p className="text-sm text-green-700">Agent: {order.assigned_agent}</p>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-sm ${i <= currentStep ? "text-blue-700 font-medium" : "text-gray-400"}`}>
                  {step.replace("_", " ")}
                </span>
                {i < STATUS_STEPS.length - 1 && <div className="w-6 h-1 bg-gray-300 rounded" />}
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Delivery Timeline</h3>
            <div className="space-y-2">
              {order.timeline.map((event, i) => (
                <div key={i} className="bg-gray-50 border-l-4 border-blue-400 p-3 rounded">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize">{event.event_type?.replace("_", " ")}</span>
                    <span className="text-gray-500">{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">{event.note}</p>
                  {event.location_hint && <p className="text-xs text-gray-400">📍 {event.location_hint}</p>}
                </div>
              ))}
            </div>
          </div>

          {order.status === "delivered" && !feedbackSent && (
            <form onSubmit={handleFeedback} className="bg-yellow-50 border rounded p-4 space-y-3">
              <h3 className="font-semibold">Leave Feedback</h3>
              <div>
                <label className="text-sm block mb-1">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="border rounded p-2 w-20"
                  value={feedback.rating}
                  onChange={(e) => setFeedback({ ...feedback, rating: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Comments</label>
                <textarea
                  className="border rounded p-2 w-full"
                  rows={3}
                  value={feedback.comments}
                  onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                />
              </div>
              <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                Submit Feedback
              </button>
            </form>
          )}
          {feedbackSent && <p className="text-green-600 font-medium">Thank you for your feedback!</p>}
        </div>
      )}
    </div>
  );
}
