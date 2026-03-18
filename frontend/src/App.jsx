import { useState, useRef, useEffect } from "react";
import { COLORS }                      from "./constants/colors";
import { searchNews }                  from "./services/newsService";
import { HomePage }                    from "./pages/HomePage";
import { LoadingPage }                 from "./pages/LoadingPage";
import { ResultPage }                  from "./pages/ResultPage";
import "./App.css";

export default function App() {
  const [page,     setPage]     = useState("home");
  const [query,    setQuery]    = useState("");
  const [inputVal, setInputVal] = useState("");
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState("");
  const inputRef = useRef(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  async function handleSearch(topic = inputVal.trim()) {
    if (!topic) return;
    setQuery(topic);
    setPage("loading");
    setError("");
    setResult(null);

    try {
      const data = await searchNews(topic);
      setResult(data);
      setPage("result");
    } catch (e) {
      setError(e.message || "Failed to fetch insights. Please try again.");
      setPage("home");
    }
  }

  function handleKeyDown(e) { if (e.key === "Enter") handleSearch(); }
  function resetSearch()    { setPage("home"); setInputVal(""); setResult(null); }

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "var(--font-display)",
      position: "relative",
      overflow: "hidden",
    }}>
      {page === "home" && (
        <HomePage
          inputVal={inputVal} setInputVal={setInputVal}
          inputRef={inputRef} error={error}
          handleSearch={handleSearch} handleKeyDown={handleKeyDown}
        />
      )}
      {page === "loading" && <LoadingPage query={query} />}
      {page === "result" && result && (
        <ResultPage query={query} result={result} resetSearch={resetSearch} />
      )}
    </div>
  );
}