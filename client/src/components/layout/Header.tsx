import { LogOut, Menu, Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  onMenuClick: () => void;
  onLogout: () => void;
}

const Header = ({ isConnected, onMenuClick, onLogout }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-lg font-bold sm:text-xl">Dashboard</h2>
          <p className="hidden text-xs text-slate-400 sm:block">
            Real-time fleet monitoring
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
          isConnected
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-700"
        }`}
      >
        {isConnected ? <Wifi size={15} /> : <WifiOff size={15} />}
        {isConnected ? "Live Connected" : "Disconnected"}
      </div>
      <button onClick={onLogout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100" aria-label="Sign out">
        <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
      </button>
      </div>
    </header>
  );
};

export default Header;
