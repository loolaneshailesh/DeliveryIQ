import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getAnalyticsSummary, getZoneHeatmap, getAgentLeaderboard, getPeakHours, getSentimentBreakdown } from "../api/service";

function Skeleton() {
  return <div className="h-6 bg-gray-200 rounded animate-pulse w-full mb-2" />;
}

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [sentiment, setSentiment] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(),
      getZoneHeatmap(),
      getAgentLeaderboard(),
      getPeakHours(),
      getSentimentBreakdown(),
    ])
      .then(([s, h, l, p, sent]) => {
        setSummary(s);
        setHeatmap(h);
        setLeaderboard(l);
        setPeakHours(p);
        setSentiment(sent);
      })
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const maxHour = Math.max(...peakHours.map((h) => h.count), 1);
  const sentimentColors = { positive: "bg-green-500", neutral: "bg-yellow-400", negative: "bg-red-500" };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} />)}</div>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-3">Orders by Status</h2>
            <div className="flex gap-3 flex-wrap">
              {summary && Object.entries(summary.by_status).map(([status, count]) => (
                <div key={status} className="bg-blue-50 border border-blue-200 rounded p-3 min-w-[120px] text-center">
                  <div className="text-2xl font-bold text-blue-700">{count}</div>
                  <div className="text-sm capitalize text-gray-600">{status.replace("_", " ")}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Zone Heatmap</h2>
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Zone</th>
                    <th className="p-2 text-left">Total Deliveries</th>
                    <th className="p-2 text-left">Avg Delivery Time</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((z) => (
                    <tr key={z.zone_id} className="border-t">
                      <td className="p-2">{z.zone_name}</td>
                      <td className="p-2">{z.total_deliveries}</td>
                      <td className="p-2">{z.avg_delivery_minutes} mins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Agent Leaderboard</h2>
            <div className="space-y-2">
              {leaderboard.map((a, i) => (
                <div key={a.agent_id} className="flex items-center gap-3 bg-white border rounded p-3">
                  <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                  <div className="flex-1">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-sm text-gray-500 ml-2">{a.completed_deliveries} deliveries</span>
                  </div>
                  {a.avg_rating && (
                    <span className="text-yellow-600 font-medium">★ {a.avg_rating}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Peak Hours (Last 7 Days)</h2>
            <div className="flex items-end gap-1 h-32">
              {Array.from({ length: 24 }, (_, h) => {
                const found = peakHours.find((p) => p.hour === h);
                const count = found ? found.count : 0;
                const height = (count / maxHour) * 100;
                return (
                  <div key={h} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-blue-500 rounded-t w-full"
                      style={{ height: `${height}%`, minHeight: count > 0 ? "4px" : "0" }}
                      title={`${h}:00 - ${count} orders`}
                    />
                    {h % 6 === 0 && <span className="text-xs text-gray-400">{h}h</span>}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Feedback Sentiment</h2>
            <div className="flex gap-3">
              {Object.entries(sentiment).map(([s, count]) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${sentimentColors[s] || "bg-gray-400"}`} />
                  <span className="capitalize text-sm">{s}: {count}</span>
                </div>
              ))}
              {Object.keys(sentiment).length === 0 && <p className="text-gray-500 text-sm">No feedback yet</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
