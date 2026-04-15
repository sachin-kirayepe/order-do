import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  CreditCard as PaymentIcon,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Console', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Subscription Plans', path: '/admin/plans', icon: <Sparkles size={18} /> },
    { name: 'Partner Shops', path: '/admin/shops', icon: <Store size={18} /> },
    { name: 'Revenue Tracking', path: '/admin/payments', icon: <PaymentIcon size={18} /> },
    { name: 'Communication', path: '/admin/messages', icon: <MessageSquare size={18} /> },
    { name: 'System Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Liquid background for entire admin panel */}
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 -z-10" />
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-secondary/5 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-md"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 h-full
        transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-4">
          <GlassCard intensity="high" className="h-full flex flex-col border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
            {/* LOGO */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-xl border border-white/20">
                   <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-lg tracking-tighter uppercase italic leading-none">
                     Admin-<span className="text-brand-primary">Do</span>
                   </span>
                   <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Control Center</span>
                </div>
              </div>
              <button className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* NAV */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center justify-between px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group
                    ${isActive 
                      ? 'bg-brand-primary text-white shadow-glow-green' 
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary'} transition-colors`}>{item.icon}</span>
                        {item.name}
                      </div>
                      {isActive && <ChevronRight size={14} className="opacity-50" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* BOTTOM ACTIONS */}
            <div className="p-4 border-t border-white/10 space-y-4 bg-white/5">
              <div className="flex justify-center">
                 <LanguageSwitcher />
              </div>
              <Button 
                variant="ghost"
                onClick={handleLogout}
                className="w-full h-12 !rounded-xl text-red-500 hover:bg-red-500/10 gap-2 font-black uppercase tracking-widest text-[10px]"
              >
                <LogOut size={18} />
                Sign Out
              </Button>
            </div>
          </GlassCard>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* HEADER */}
        <header className="h-20 flex items-center justify-between px-8 bg-white/20 dark:bg-slate-950/20 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-30">
          <button className="lg:hidden p-3 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-white/20 text-slate-500 hover:scale-105 active:scale-95 transition-all" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
             <div className="flex items-center gap-2.5 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20 shadow-glow-green/10">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Master Administrator</span>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
             </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
