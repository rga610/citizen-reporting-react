interface LeaderboardEntry {
  username: string;
  totalReports: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  userCode?: string;
  userScore?: number;
  userRank?: number;
  totalParticipants?: number;
}

export default function Leaderboard({ 
  entries, 
  userCode, 
  userScore = 0,
  userRank,
  totalParticipants = 0
}: LeaderboardProps) {
  const percentile = totalParticipants > 0 && userRank 
    ? Math.round(((totalParticipants - userRank) / totalParticipants) * 100)
    : 0;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 space-y-4">
      {/* User Status Card */}
      {userScore > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              👤
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-90">You are in top {percentile}% of contributors</p>
              <p className="text-xl font-bold">with scoring {userScore} points</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🏆</span>
        <h2 className="text-xl font-bold text-gray-800">Leaderboards</h2>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No participants yet</p>
        ) : (
          entries.map((entry, index) => {
            const isUser = entry.username === userCode;
            return (
              <div
                key={entry.username}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isUser 
                    ? "bg-blue-50 border-2 border-blue-500" 
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                  index === 0 ? "bg-yellow-400 text-yellow-900" :
                  index === 1 ? "bg-gray-300 text-gray-700" :
                  index === 2 ? "bg-orange-300 text-orange-900" :
                  "bg-gray-200 text-gray-600"
                }`}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm">👤</span>
                </div>

                {/* Username */}
                <div className="flex-1">
                  <p className={`font-medium ${isUser ? "text-blue-700" : "text-gray-800"}`}>
                    {entry.username}
                    {isUser && " (You)"}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className={`font-bold ${isUser ? "text-blue-700" : "text-gray-800"}`}>
                    {entry.totalReports}p
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

