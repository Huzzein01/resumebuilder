import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import PrintView from "./pages/PrintView.js";
import PrintCoverLetterView from "./pages/PrintCoverLetterView.js";
import "./index.css";

const coverLetterMatch = window.location.pathname.match(/^\/print\/cover-letter\/([^/]+)$/);
const printMatch = window.location.pathname.match(/^\/print\/([^/]+)$/);

function resolvePage() {
  if (coverLetterMatch) {
    const params = new URLSearchParams(window.location.search);
    return (
      <PrintCoverLetterView
        id={coverLetterMatch[1]}
        companyName={params.get("companyName") ?? undefined}
        hiringManagerName={params.get("hiringManagerName") ?? undefined}
      />
    );
  }
  if (printMatch) return <PrintView id={printMatch[1]} />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode>{resolvePage()}</React.StrictMode>);
