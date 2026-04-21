import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, LayoutDashboard, ShieldCheck, CreditCard, 
  Sparkles, Store, AlertCircle, Info, Play, 
  Fingerprint, Users, Zap, Search, Smartphone, 
  Monitor, Eye, Filter, Bell, BookOpen, FileText,
  HelpCircle, Settings, Shield, History as HistoryIcon,
  Download, ShieldAlert, CheckCircle2
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';

interface AdminMasterGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorialSections = [
  {
    id: 'intro',
    title: '1. Introduction',
    icon: <Info className="text-blue-500" />,
    content: (
      <div className="space-y-6">
        <div className="aspect-video bg-slate-900 rounded-3xl flex items-center justify-center border-4 border-brand-primary/20 relative overflow-hidden group shadow-2xl">
          <img src="/admin_dashboard_mockup_1776403926105.png" alt="Dashboard" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[2000ms]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
          <div className="relative z-10 text-center p-8">
             <div className="w-20 h-20 bg-brand-primary/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-brand-primary/30 mx-auto mb-4 group-hover:scale-125 transition-all cursor-pointer">
                <Play size={32} className="text-white fill-white ml-1" />
             </div>
             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Order-Do Admin Control</h2>
             <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mt-2">The Engine Behind the Ecosystem</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
            <h4 className="text-sm font-black text-white uppercase italic mb-4">What is Order-Do Admin Panel?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Order-Do Admin Panel ek **Central Control Station** hai jahan se aap poore system ko manage karte hain. Ye aapko power deta hai har shopkeeper, har transaction aur har feature ko control karne ka.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
               <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <h5 className="text-[10px] font-black text-brand-primary uppercase mb-2">Main Purpose</h5>
                  <p className="text-[10px] text-slate-500">Platform ki security, growth aur shops ki subscription health ko monitor karna.</p>
               </div>
               <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <h5 className="text-[10px] font-black text-brand-primary uppercase mb-2">Capabilities</h5>
                  <p className="text-[10px] text-slate-500">Plan creation, payment confirmation, device management aur detailed analytics.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'login',
    title: '2. Admin Login Protocol',
    icon: <ShieldCheck className="text-emerald-500" />,
    content: (
      <div className="space-y-8">
        <div className="p-12 bg-slate-950 rounded-[3rem] border-2 border-brand-primary/20 relative overflow-hidden text-center">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-5 blur-[100px]" />
           <div className="w-24 h-24 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-brand-primary/20">
              <Fingerprint size={48} className="text-brand-primary" />
           </div>
           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Authentication Layers</h3>
           <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">Admin access ke liye 2-layer security use hoti hai.</p>
        </div>
        <div className="space-y-4">
           <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-black text-brand-primary">01</div>
                 <p className="text-xs text-white font-black uppercase tracking-widest">Email & Password Handshake</p>
              </div>
              <p className="text-[10px] text-slate-500 ml-12">Pehle step mein aap apna admin email aur password enter karke primary link establish karte hain.</p>
           </div>
           <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-black text-brand-primary">02</div>
                 <p className="text-xs text-white font-black uppercase tracking-widest">Master Protocol PIN</p>
              </div>
              <p className="text-[10px] text-slate-500 ml-12">Login ke baad system aapse **6-digit Master PIN** maangega. Iske bina sensitive tabs (Shops/Payments) open nahi honge.</p>
           </div>
           <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-500 font-bold uppercase leading-tight">PIN Bhool gaye? Database reset ya recovery card (Settings mein) se hi recover hoga.</p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: '3. Mission Console (Dashboard)',
    icon: <LayoutDashboard className="text-purple-500" />,
    content: (
      <div className="space-y-8">
        <div className="aspect-video bg-slate-900 rounded-3xl border-2 border-white/10 relative overflow-hidden group">
          <img src="/admin_dashboard_mockup_1776403926105.png" alt="Dashboard" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
        <div className="space-y-4">
           <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Understanding the 4 Command Cards</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                 <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Shops</h4>
                 <p className="text-[10px] text-slate-500">Platform par onboarded total vendors ki count.</p>
              </div>
              <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Active Subscriptions</h4>
                 <p className="text-[10px] text-slate-500">Wo shops jinhone pay kiya hai aur jinka system abhi LIVE hai.</p>
              </div>
              <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending Payments</h4>
                 <p className="text-[10px] text-slate-500">Wo shopkeepers jinhone payment proof submit kiya hai par aapne verify nahi kiya.</p>
              </div>
              <div className="p-5 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                 <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Total Revenue</h4>
                 <p className="text-[10px] text-slate-500">Ab tak ki total verified sales ka gross amount.</p>
              </div>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'shops',
    title: '4. Nexus Directory (Shops)',
    icon: <Store className="text-rose-500" />,
    content: (
      <div className="space-y-8">
        <div className="aspect-video bg-slate-900 rounded-3xl border-2 border-white/10 relative overflow-hidden">
          <img src="/shop_management_mockup_1776403943997.png" alt="Shops" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="space-y-6">
           <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 space-y-4">
              <h4 className="text-sm font-black text-white uppercase italic">Management Workflow</h4>
              <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-xs text-slate-400">
                    <Search size={14} className="text-brand-primary" /> **Search & Filter:** Shop Name ya ID se instantly dhundhein.
                 </li>
                 <li className="flex items-center gap-3 text-xs text-slate-400">
                    <Eye size={14} className="text-brand-primary" /> **Detail View:** Shop par click karke uske products, sales aur settings dekhein.
                 </li>
                 <li className="flex items-center gap-3 text-xs text-slate-400">
                    <Filter size={14} className="text-brand-primary" /> **Status Check:** Green (Active), Amber (Pending/Review), Red (Expired).
                 </li>
              </ul>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'payments',
    title: '5. Payment Monitoring',
    icon: <CreditCard className="text-amber-500" />,
    content: (
      <div className="space-y-8">
        <div className="aspect-video bg-slate-900 rounded-3xl border-2 border-white/10 relative overflow-hidden group">
          <img src="/payment_verification_mockup_1776403961295.png" alt="Payments" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
             <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
          </div>
        </div>
        <div className="space-y-6">
           <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Step-by-Step Confirmation Process</h4>
           <div className="space-y-3">
              {[
                { step: '01', desc: 'Pending Tab mein shopkeeper ka submitted **UTR/Ref Number** check karein.' },
                { step: '02', desc: 'Apne bank account mein amount verify karein.' },
                { step: '03', desc: '**Confirm** button par click karein.' }
              ].map((s, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                   <div className="text-xs font-black text-brand-primary shrink-0">{s.step}</div>
                   <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
           </div>
           <div className="p-5 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
              <p className="text-[10px] font-black text-brand-primary uppercase mb-1">What happens after this?</p>
              <p className="text-[10px] text-slate-300 italic">"Confirmation ke saath hi system shop ka expiry date calculate karke badha deta hai aur features ko instantly unlock kar deta hai."</p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'plans',
    title: '6. Plan Matrix (Features)',
    icon: <Sparkles className="text-cyan-500" />,
    content: (
      <div className="space-y-8">
        <div className="aspect-video bg-slate-900 rounded-3xl border-2 border-white/10 relative overflow-hidden">
          <img src="/admin_plan_features_grid_1776405674701.png" alt="Features" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="space-y-6">
           <h4 className="text-sm font-black text-white uppercase italic tracking-widest">9 Core Power Features</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: <Users size={12} />, title: 'Multi-Counter', desc: 'Alag-alag tables ya sections manage karna.' },
                { icon: <Smartphone size={12} />, title: 'Max Devices', desc: 'Ek saath kitne phone login ho sakte hain.' },
                { icon: <Zap size={12} />, title: 'Dhara AI Voice', desc: 'AI-driven voice ordering aur announcements.' },
                { icon: <Bell size={12} />, title: 'Real-time Alerts', desc: 'Naye order par turant notification.' },
                { icon: <Monitor size={12} />, title: 'KDS System', desc: 'Kitchen ke liye dedicated display UI.' },
                { icon: <FileText size={12} />, title: 'Advanced Reports', desc: 'Excel/PDF export aur inventory depth.' },
                { icon: <Zap size={12} />, title: 'Ad-Free', desc: 'Bina kisi distraction ke customer experience.' },
                { icon: <HelpCircle size={12} />, title: 'Priority Support', desc: 'Aapki taraf se special support link.' },
                { icon: <Store size={12} />, title: 'Custom Branding', desc: 'Shop ka apna logo aur color theme.' }
              ].map((f, i) => (
                <div key={i} className="p-4 bg-white/[0.02] rounded-xl border border-white/5 flex gap-3 items-center">
                   <div className="text-cyan-500">{f.icon}</div>
                   <div>
                      <p className="text-[10px] font-black text-white uppercase">{f.title}</p>
                      <p className="text-[9px] text-slate-500">{f.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'assigning',
    title: '7. Assigning & Overrides',
    icon: <Settings className="text-indigo-500" />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Plan Protocol Management</h3>
        <div className="space-y-4">
           <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 space-y-4">
              <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Manual Override Logic</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                 Agar aap **"Autonomous Mode"** OFF karte hain, toh aap khud expiry date set kar sakte hain. Ye tab kaam aata hai jab aap kisi khas client ko trial dena chahte hain ya special conditions apply karna chahte hain.
              </p>
           </div>
           <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <p className="text-[10px] font-black text-indigo-500 uppercase mb-1">Impact Check</p>
              <p className="text-[10px] text-slate-300 italic">"Plan change hote hi shopkeeper ka dashboard instantly update hota hai. Naye features bina refresh kiye activate ho jate hain."</p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'devices',
    title: '8. Security Ops (Devices)',
    icon: <Shield className="text-blue-500" />,
    content: (
      <div className="space-y-8">
        <div className="aspect-video bg-slate-900 rounded-3xl border-2 border-white/10 relative overflow-hidden">
          <img src="/admin_device_security_visual_1776405701103.png" alt="Security" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="space-y-4">
           <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 space-y-4">
              <h4 className="text-xs font-black text-white uppercase italic">Session Control</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Admin ke paas power hai kisi bhi shopkeeper ko **Force Logout** karne ki. Agar koi purana employee login hai ya device limit exceed ho gayi hai, toh aap use yahan se block kar sakte hain.</p>
              <div className="flex gap-4">
                 <div className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-[8px] font-black border border-red-500/20">FORCE_KILL_SESSION</div>
                 <div className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-[8px] font-black border border-blue-500/20">LOCK_IDENTIFIER</div>
              </div>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'reports',
    title: '9. Data Lifecycle',
    icon: <HistoryIcon className="text-slate-400" />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">30-Day Auto Archive</h3>
        <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/5 space-y-6">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white"><Download size={24} /></div>
              <div>
                 <h4 className="text-xs font-black text-white uppercase italic">Monthly Export</h4>
                 <p className="text-[10px] text-slate-500 mt-1">Shopkeepers ko apna data har 30 din mein download kar lena chahiye.</p>
              </div>
           </div>
           <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
              <p className="text-[10px] font-black text-red-500 uppercase">Warning</p>
              <p className="text-[9px] text-slate-500 italic mt-1">"System performance ke liye 30 din se purane orders automatically archive aur phir delete ho jate hain."</p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 'troubleshooting',
    title: '10. Emergency Protocols',
    icon: <ShieldAlert className="text-red-500" />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Common Resolution Tree</h3>
        <div className="space-y-3">
           {[
             { q: 'Shop list mein nahi dikh rahi?', a: 'Search bar check karein ya filter "All" par set karein.' },
             { q: 'Payment confirm ki par activate nahi hua?', a: 'Expiry date manually check karein aur "Resync" trigger karein.' },
             { q: 'Real-time updates nahi aa rahe?', a: 'Dashboard header par click karke Postgres Shard ko refresh karein.' },
             { q: 'Login loop ya PIN reject?', a: 'Browser cache clear karein aur device ka system time check karein.' }
           ].map((t, i) => (
             <div key={i} className="p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-white uppercase italic mb-1">Q: {t.q}</p>
                <p className="text-[10px] text-brand-primary font-bold">SOL: {t.a}</p>
             </div>
           ))}
        </div>
      </div>
    )
  },
  {
    id: 'tips',
    title: '11. Elite Admin Tips',
    icon: <Zap className="text-brand-primary" />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Maximum Efficiency</h3>
        <div className="grid grid-cols-1 gap-4">
           <div className="p-6 bg-brand-primary/5 rounded-3xl border border-brand-primary/20 flex gap-4 items-center">
              <CheckCircle2 className="text-brand-primary shrink-0" size={24} />
              <p className="text-xs text-slate-300 font-medium">Har din ke end mein **Pending Payments** clear karne se network stability bani rehti hai.</p>
           </div>
           <div className="p-6 bg-brand-primary/5 rounded-3xl border border-brand-primary/20 flex gap-4 items-center">
              <CheckCircle2 className="text-brand-primary shrink-0" size={24} />
              <p className="text-xs text-slate-300 font-medium">Security ke liye apna **Master PIN** har 3 mahine mein badalte rahein.</p>
           </div>
           <div className="p-6 bg-brand-primary/5 rounded-3xl border border-brand-primary/20 flex gap-4 items-center">
              <CheckCircle2 className="text-brand-primary shrink-0" size={24} />
              <p className="text-xs text-slate-300 font-medium">Naye features release karne se pehle **Global Announcement** broadcast zarur karein.</p>
           </div>
        </div>
      </div>
    )
  }
];

export default function AdminMasterGuide({ isOpen, onClose }: AdminMasterGuideProps) {
  const [activeSection, setActiveSection] = useState(tutorialSections[0].id);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        >
          <GlassCard intensity="high" className="flex-1 flex flex-col md:flex-row border-white/20 shadow-2xl overflow-hidden rounded-[2.5rem]">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-80 bg-black/60 border-r border-white/5 flex flex-col h-full">
               <div className="p-10 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-glow-green">
                        <BookOpen className="text-white" size={24} />
                     </div>
                     <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Complete Guide</h3>
                        <p className="text-[8px] font-black text-brand-primary uppercase tracking-widest mt-1">Admin Operations</p>
                     </div>
                  </div>
                  <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                  {tutorialSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left ${
                        activeSection === section.id 
                          ? 'bg-brand-primary text-white shadow-glow-green scale-[1.02]' 
                          : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                      }`}
                    >
                      <span className={activeSection === section.id ? 'text-white' : ''}>{section.icon}</span>
                      {section.title}
                    </button>
                  ))}
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-950/50">
               <div className="absolute top-0 right-0 p-10 z-20 hidden md:block">
                  <button 
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white border border-white/10"
                  >
                     <X size={24} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-10 md:p-20 custom-scrollbar relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="max-w-3xl mx-auto"
                    >
                      {tutorialSections.find(s => s.id === activeSection)?.content}
                    </motion.div>
                  </AnimatePresence>
               </div>

               {/* Footer Controls */}
               <div className="p-10 bg-black/60 border-t border-white/5 flex items-center justify-between backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-brand-primary animate-pulse shadow-glow-green" />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Phase {tutorialSections.findIndex(s => s.id === activeSection) + 1} of {tutorialSections.length}</span>
                  </div>
                  <div className="flex gap-4">
                     <Button 
                       variant="ghost" 
                       onClick={() => {
                         const idx = tutorialSections.findIndex(s => s.id === activeSection);
                         if (idx > 0) setActiveSection(tutorialSections[idx - 1].id);
                       }}
                       disabled={activeSection === tutorialSections[0].id}
                       className="px-8 h-12 !rounded-xl text-[10px] font-black uppercase tracking-widest"
                     >
                        Previous
                     </Button>
                     <Button 
                       variant="primary" 
                       onClick={() => {
                         const idx = tutorialSections.findIndex(s => s.id === activeSection);
                         if (idx < tutorialSections.length - 1) setActiveSection(tutorialSections[idx + 1].id);
                         else onClose();
                       }}
                       className="px-10 h-12 !rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow-green"
                     >
                        {activeSection === tutorialSections[tutorialSections.length - 1].id ? 'Mission Complete' : 'Next Section'}
                     </Button>
                  </div>
               </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
