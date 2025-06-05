#!/usr/bin/env node
import React from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "../atoms/Icon"; // Import the real Icon atom

interface DefaultLayoutProps {
  children: React.ReactNode;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/results", label: "Test Results", icon: "test-results" },
    { path: "/test-runner", label: "Test Runner", icon: "test-runner" },
  ];

  return (
    <div className="t-default-layout">
      <aside className="t-default-layout__sidebar">
        <div className="t-default-layout__sidebar-header">
          <h1 className="t-default-layout__sidebar-title">K6 Dashboard</h1>
        </div>
        <nav className="t-default-layout__sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path)) ? "active" : ""}
                >
                  <Icon name={item.icon} customClassName="nav-icon" /> {/* Added customClassName for potential specific styling */}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="t-default-layout__main-content">
        <div className="t-default-layout__content-inner">{children}</div>
      </main>
    </div>
  );
};

export default DefaultLayout;
