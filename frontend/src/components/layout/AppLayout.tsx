import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          w-72
          transform transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="min-h-screen lg:ml-72">

        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex h-16 items-center border-b border-white/[0.07] bg-[#080808]/90 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() =>
              setSidebarOpen((previous) => !previous)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-400"
          >
            {sidebarOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

          <span className="ml-3 text-sm font-semibold">
            ERP Portal
          </span>
        </div>

        <Topbar />

        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration: 0.2,
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}