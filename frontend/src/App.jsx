import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import OrderPlacement from "./pages/OrderPlacement";
import OrderTracker from "./pages/OrderTracker";
import AgentDashboard from "./pages/AgentDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import CustomerPortal from "./pages/CustomerPortal";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="bg-blue-700 text-white p-4 flex gap-4 flex-wrap">
        <span className="font-bold text-lg mr-4">DeliveryIQ</span>
        <Link to="/" className="hover:underline">Place Order</Link>
        <Link to="/track" className="hover:underline">Track Order</Link>
        <Link to="/agent" className="hover:underline">Agent</Link>
        <Link to="/ops" className="hover:underline">Operations</Link>
        <Link to="/analytics" className="hover:underline">Analytics</Link>
        <Link to="/customer" className="hover:underline">Customer Portal</Link>
      </nav>
      <div className="p-6 max-w-5xl mx-auto">
        <Routes>
          <Route path="/" element={<OrderPlacement />} />
          <Route path="/track" element={<OrderTracker />} />
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/ops" element={<OperationsDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/customer" element={<CustomerPortal />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
