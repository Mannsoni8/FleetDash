
import {
  LayoutDashboard,
  Truck,
  Bell,
  MapPin,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Live Vehicles", href: "#vehicles", icon: Truck },
  { label: "Alerts", href: "#alerts", icon: Bell },
  { label: "Tracking", href: "#tracking", icon: MapPin },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2 text-white">
              <Truck size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">FleetDash</h1>
              <p className="text-xs text-slate-400">Fleet Management</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <p className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          {navigation.map(({ label, href, icon: Icon }, index) => (
            <a
              key={label}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                index === 0
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={19} />
              {label}
            </a>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold">FleetDash Backend</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Realtime monitoring
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
