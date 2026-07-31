import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppProvider>
      {loading && (
        <div className="loading-screen">
          <div className="loading-spinner" />
        </div>
      )}
      <div className="appShell">
        <Header />
        <main className="wrap">
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
          <div className="footerCol">
            <div className="footerBrand">
              <img src="/logo/logo.png" alt="Flux" className="mark markSmall" />
              Flux
            </div>
            <div className="footerDesc">
              The world's premier gateway to fractional real estate liquidity. Redefining property
              ownership for the digital age.
            </div>
          </div>
          <div className="footerCol">
            <div className="footerHeading">Marketplace</div>
            <ul className="footerLinks">
              <li><Link to="/">Latest Drops</Link></li>
              <li><Link to="/portfolio">Secondary Market</Link></li>
              <li><Link to="/">Asset Classes</Link></li>
              <li><Link to="/profile">Yield Calculator</Link></li>
            </ul>
          </div>
          <div className="footerCol">
            <div className="footerHeading">Platform</div>
            <ul className="footerLinks">
              <li><Link to="/team">Security</Link></li>
              <li><Link to="/team">Smart Contracts</Link></li>
              <li><Link to="/list">API Docs</Link></li>
              <li><Link to="/profile">Investor Kit</Link></li>
            </ul>
          </div>
          <div className="footerCol">
            <div className="footerHeading">Compliance</div>
            <div className="footerCompliance">
              Real estate investments involve risks. Performance is not guaranteed. Fractional tokens
              are issued under Reg D/S exemptions. Please consult your financial advisor before
              committing capital.
            </div>
          </div>
          <div className="footerBottom">
            © {new Date().getFullYear()} Obsidian Flux LLC. All rights reserved.
          </div>
        </footer>
      </div>
      <Toast />
    </AppProvider>
  );
}
