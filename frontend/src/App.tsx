import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";

import Customers from "./pages/customers/Customers";
import CustomerDetails from "./pages/customers/CustomerDetails";

import Products from "./pages/products/Products";
import Inventory from "./pages/products/Inventory";

import Challans from "./pages/challans/Challans";

import FollowUps from "./pages/followups/FollowUps";

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* ========================================
          AUTHENTICATION
      ======================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* ========================================
          PROTECTED ERP APPLICATION
      ======================================== */}

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Root */}
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Customers */}
        <Route
          path="/customers"
          element={<Customers />}
        />

        <Route
          path="/customers/:id"
          element={<CustomerDetails />}
        />

        {/* Products */}
        <Route
          path="/products"
          element={<Products />}
        />

        {/* Inventory */}
        <Route
          path="/inventory"
          element={<Inventory />}
        />

        {/* Sales Challans */}
        <Route
          path="/challans"
          element={<Challans />}
        />

        {/* Follow-ups */}
        <Route
          path="/followups"
          element={<FollowUps />}
        />
      </Route>

      {/* ========================================
          UNKNOWN ROUTES
      ======================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}