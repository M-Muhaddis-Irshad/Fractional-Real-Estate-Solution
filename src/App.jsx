import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Header from "./components/Header";
import Toast from "./components/Toast";
import Discover from "./pages/Discover";
import PropertyDetail from "./pages/PropertyDetail";
import Portfolio from "./pages/Portfolio";
import TeamDashboard from "./pages/TeamDashboard";
import ListProperty from "./pages/ListProperty";
import Profile from "./pages/Profile";
import "./App.css";

export default function App() {
  return (
    <AppProvider>
      <Header />
      <div className="wrap">
        <main>
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/team" element={<TeamDashboard />} />
            <Route path="/list" element={<ListProperty />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <footer className="footer">
          <div>
            <div className="footerBrand">Fractional</div>
            <div className="footerDesc">
              A demo platform for fractional real-estate ownership. Browse, invest, and manage your portfolio — all data is stored locally in your browser.
            </div>
          </div>
          <div>
            <div className="footerHeading">Platform</div>
            <ul className="footerLinks">
              <li><a href="/">Discover</a></li>
              <li><a href="/portfolio">My Ledger</a></li>
              <li><a href="/team">Team</a></li>
              <li><a href="/list">List Property</a></li>
            </ul>
          </div>
          <div>
            <div className="footerHeading">Resources</div>
            <ul className="footerLinks">
              <li><a href="https://github.com/anomalyco/opencode" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://opencode.ai" target="_blank" rel="noopener noreferrer">Documentation</a></li>
            </ul>
          </div>
          <div className="footerBottom">
            Demo MVP &middot; data persists to your browser's local storage &middot; no real transactions occur
          </div>
        </footer>
        <Toast />
      </div>
    </AppProvider>
  );
}
