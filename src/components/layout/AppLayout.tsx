import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import SyncIndicator from "./SyncIndicator";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileToggle={setMobileOpen} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex justify-end mb-4">
            <SyncIndicator />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
