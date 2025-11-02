import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Intro from './pages/Intro'
import Instructions from './pages/Instructions'
import Hunt from './pages/Hunt'
import Feedback from './pages/Feedback'
import Profile from './pages/Profile'
import Survey from './pages/Survey'
import Results from './pages/Results'
import Report from './pages/Report'
import Admin from './pages/Admin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/hunt" element={<Hunt />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/report" element={<Report />} />
        <Route path="/results" element={<Results />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App