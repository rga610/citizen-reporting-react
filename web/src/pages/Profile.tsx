import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate("/hunt")} className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Profile</h1>
        <div className="w-10"></div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-8 space-y-6">
        {/* Welcome Section */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-600 text-3xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome back!</h2>
          <p className="text-gray-600 mt-2">Participant Profile</p>
        </div>

        {/* User Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Information</h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between">
              <span className="font-medium">Participant Code:</span>
              <span className="text-gray-600">Loading...</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Treatment:</span>
              <span className="text-gray-600">Loading...</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Reports:</span>
              <span className="text-gray-600">Loading...</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg px-4 py-3 text-left transition-colors">
            Terms & Policy
          </button>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg px-4 py-3 text-left transition-colors">
            Edit profile
          </button>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg px-4 py-3 text-left transition-colors">
            About Experiment
          </button>
          <button className="w-full bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-4 py-3 text-left transition-colors">
            Withdraw Application :*(
          </button>
        </div>
      </div>

      {/* Back Button */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <button
          onClick={() => navigate("/hunt")}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-4 py-3 font-medium transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}

