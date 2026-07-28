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
import "./App.css";

export default function App() {
  return (
    <AppProvider>
      <div className="wrap">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/team" element={<TeamDashboard />} />
            <Route path="/list" element={<ListProperty />} />
          </Routes>
        </main>
        <footer className="footer">
          Demo MVP · data persists to your browser's local storage · no real transactions occur
        </footer>
        <Toast />
      </div>
    </AppProvider>
  );
}
