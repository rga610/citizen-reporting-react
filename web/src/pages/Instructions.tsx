import { useNavigate } from "react-router-dom";

export default function Instructions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-800 text-center">Campus Report</h1>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome to the Campus Reporting Experiment
          </h2>
          <p className="text-gray-600 text-lg">
            Help researchers understand how feedback influences citizen engagement
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">What you'll do:</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-500 text-xl">📍</span>
              <span>Walk around campus and find QR codes or issue markers</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 text-xl">📷</span>
              <span>Scan QR codes or enter issue codes manually</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 text-xl">🏆</span>
              <span>See your ranking and compete with others</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 text-xl">⏱️</span>
              <span>Session lasts about 60 minutes</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> This is a research experiment. By continuing, you consent to participate. 
            Location data is optional and will only be used for research purposes.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Privacy & Ethics</h3>
          <p className="text-sm text-gray-600">
            • No personal information is collected<br/>
            • All data is pseudonymous<br/>
            • Data stored securely in EU-based servers<br/>
            • You can withdraw at any time
          </p>
        </div>
      </div>

      {/* Start Button */}
      <div className="px-6 py-6 bg-white border-t border-gray-200">
        <button
          onClick={() => navigate("/hunt")}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg px-6 py-4 text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-colors shadow-lg"
        >
          Start Reporting
        </button>
      </div>
    </div>
  );
}
