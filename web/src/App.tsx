import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Instructions from "./pages/Instructions";
import Hunt from "./pages/Hunt";
import Survey from "./pages/Survey";
import Results from "./pages/Results";
import Profile from "./pages/Profile";

function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Instructions/>} />
      <Route path="/hunt" element={<Hunt/>} />
      <Route path="/profile" element={<Profile/>} />
      <Route path="/survey" element={<Survey/>} />
      <Route path="/results" element={<Results/>} />
    </Routes>
  </BrowserRouter>;
}

export default App