import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRScanner from "../components/QRScanner";
import Leaderboard from "../components/Leaderboard";
import CampusMap from "../components/CampusMap";
import { api } from "../utils/api";

interface ParticipantData {
  status: string;
  treatment?: string;
  publicCode?: string;
  feedback?: {
    leaderboard?: Array<{ publicCode: string; totalReports: number }>;
  };
}

interface SSEUpdate {
  type: string;
  top?: Array<{ publicCode: string; totalReports: number }>;
}

export default function Hunt() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ publicCode: string; totalReports: number }>>([]);
  const [userScore, setUserScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Initialize participant on mount
  useEffect(() => {
    async function join() {
      try {
        const res = await api.join();
        const data: ParticipantData = await res.json();
        setParticipant(data);
        if (data.publicCode && data.feedback?.leaderboard) {
          setLeaderboard(data.feedback.leaderboard);
          const userEntry = data.feedback.leaderboard.find(e => e.publicCode === data.publicCode);
          if (userEntry) setUserScore(userEntry.totalReports);
        }
      } catch (err) {
        console.error("Join error:", err);
        setStatus("Failed to join. Please refresh.");
      }
    }
    join();
  }, []);

  // SSE for real-time leaderboard updates (competitive treatment)
  useEffect(() => {
    const es = api.sse(1);
    
    es.onmessage = (e) => {
      try {
        const update: SSEUpdate = JSON.parse(e.data);
        if (update.type === "comp" && update.top) {
          setLeaderboard(update.top);
          // Update user score if present
          if (participant?.publicCode) {
            const userEntry = update.top.find(e => e.publicCode === participant.publicCode);
            if (userEntry) setUserScore(userEntry.totalReports);
          }
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    es.onerror = () => {
      console.error("SSE connection error");
    };

    return () => es.close();
  }, [participant?.publicCode]);

  async function submitIssue(issueId: string) {
    if (!issueId.trim()) return;
    
    setSubmitting(true);
    setStatus("Submitting...");

    try {
      const issue_id = issueId.trim().toUpperCase();
      
      // Get location if available
      let lat: number | undefined;
      let lon: number | undefined;
      let accuracy: number | undefined;
      
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          accuracy = pos.coords.accuracy;
        } catch (err) {
          // Location optional, continue without it
        }
      }

      const res = await api.report(issue_id, lat, lon, accuracy);
      const data = await res.json();

      if (data.status === "ok") {
        if (data.feedback?.leaderboard) {
          setLeaderboard(data.feedback.leaderboard);
        }
        if (data.feedback?.myCount !== undefined) {
          setUserScore(data.feedback.myCount);
        }
        setStatus(`✓ Reported successfully!`);
        setCode("");
        
        // Clear status after 3 seconds
        setTimeout(() => setStatus(""), 3000);
      } else if (data.status === "duplicate") {
        setStatus("⚠ Already reported this issue");
        setTimeout(() => setStatus(""), 3000);
      } else if (data.status === "invalid") {
        setStatus(`✗ ${data.message || "Invalid issue code"}`);
        setTimeout(() => setStatus(""), 3000);
      } else {
        setStatus(`Error: ${data.message || "Unknown error"}`);
      }
    } catch (err: any) {
      setStatus(`✗ ${err.message || "Failed to submit"}`);
      setTimeout(() => setStatus(""), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  function handleQRScan(code: string) {
    setShowScanner(false);
    submitIssue(code);
  }

  const userRank = leaderboard.findIndex(e => e.publicCode === participant?.publicCode) + 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Campus Report</h1>
        <button onClick={() => navigate("/profile")} className="p-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xs">👤</span>
          </div>
        </button>
      </header>

      {/* Main Title */}
      <div className="px-4 py-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <h2 className="text-xl font-bold text-center">Help to make Campus a better place</h2>
      </div>

      {/* Map Section */}
      <div className="flex-1 px-4 py-4" style={{ minHeight: "300px" }}>
        <CampusMap />
      </div>

      {/* Report Input Section */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code (e.g., ISSUE_A01)"
            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === "Enter" && !submitting && submitIssue(code)}
            disabled={submitting}
          />
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2.01M19 8h2.01M12 12h2.01M12 20h2.01M5 20h2.01M19 20h2.01" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => submitIssue(code)}
          disabled={submitting || !code.trim()}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Submitting..." : "Report Issue"}
        </button>

        {status && (
          <div className={`p-3 rounded-lg text-center ${
            status.startsWith("✓") ? "bg-green-100 text-green-800" :
            status.startsWith("⚠") ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          }`}>
            {status}
          </div>
        )}
      </div>

      {/* Competitive Leaderboard Section */}
      {participant?.treatment === "competitive" && (
        <div className="bg-white border-t border-gray-200 px-4 py-6">
          <Leaderboard
            entries={leaderboard}
            userCode={participant?.publicCode}
            userScore={userScore}
            userRank={userRank}
            totalParticipants={leaderboard.length}
          />
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
