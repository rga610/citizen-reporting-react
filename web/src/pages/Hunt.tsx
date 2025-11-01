import { useEffect, useState } from "react";

export default function Hunt(){
  const [status, setStatus] = useState("Ready");
  const [code, setCode] = useState("");

  useEffect(() => {
    fetch("/api/join", { credentials: "include" });
  }, []);

  async function submit(v?: string){
    const issue_id = (v ?? code).trim().toUpperCase();
    if(!issue_id) return;
    setStatus("Sending...");
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ issue_id })
    });
    const data = await res.json();
    setStatus(JSON.stringify(data.feedback ?? data));
    setCode("");
  }

  useEffect(() => {
    const es = new EventSource(`/api/sse/slot/1`);
    es.onmessage = () => {
      // Could parse and update cooperative or competitive UI here
    };
    return () => es.close();
  }, []);

  return <div className="p-4 space-y-3">
    <h1 className="text-xl font-semibold">Report issues</h1>
    <input value={code} onChange={e=>setCode(e.target.value)} placeholder="ISSUE_A01" className="border rounded px-3 py-2 w-full"/>
    <button onClick={()=>submit()} className="px-4 py-2 rounded bg-sky-600 text-white">Send</button>
    <p className="text-sm">{status}</p>
  </div>;
}