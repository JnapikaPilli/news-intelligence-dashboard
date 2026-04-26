import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useStore } from "./store/useStore";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import DocumentQA from "./pages/DocumentQA";
import SearchResults from "./pages/SearchResults";

export default function App() {
  const { initTheme } = useStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 hide-scrollbar relative z-10">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/qa" element={<DocumentQA />} />
              <Route path="/search" element={<SearchResults />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}