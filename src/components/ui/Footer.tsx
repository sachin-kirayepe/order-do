import { Link } from 'react-router-dom';
import { Mail, Globe, Heart, ShieldCheck, HelpCircle, LayoutDashboard, QrCode, Sparkles } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1.3fr] gap-4 mb-16">
          
          {/* Section 1: Branding */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-kirana-green rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-kirana-green/20 group-hover:scale-110 transition-transform">
                OD
              </div>
              <span className="font-black text-2xl tracking-tighter dark:text-white uppercase italic">
                Order-Do
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs">
              Empowering local Indian shopkeepers with simple, fast, and secure voice-powered QR ordering technology.
            </p>
            <div className="flex flex-col items-start gap-2 pt-2">
               <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                  <Globe size={12} /> Made In India
               </div>
               <div className="px-3 py-1 bg-kirana-orange/10 text-kirana-orange rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                  <Heart size={12} fill="currentColor" /> For You
               </div>
            </div>
          </div>

          {/* Section 2: Quick Links */}
          <div className="space-y-6 text-center md:text-left">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green transition-colors">Home</Link></li>
              <li><Link to="/how-it-works" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green transition-colors">How It Works</Link></li>
              <li><Link to="/about" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green transition-colors">About Us</Link></li>
              <li><Link to="/resources" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green transition-colors">Resources & Blog</Link></li>
              <li><Link to="/testimonials" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green transition-colors">Testimonials</Link></li>
              <li><Link to="/contact" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Section 3: For Shopkeepers */}
          <div className="space-y-6 text-center md:text-left">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">For Shopkeepers</h4>
            <ul className="space-y-4">
              <li><Link to="/shop/dashboard" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green flex items-center gap-2 justify-center md:justify-start"><LayoutDashboard size={16}/> Dashboard</Link></li>
              <li><Link to="/shop/register" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green flex items-center gap-2 justify-center md:justify-start"><QrCode size={16}/> Generate QR</Link></li>
              <li><Link to="/plans" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green flex items-center gap-2 justify-center md:justify-start"><Sparkles size={16}/> Subscription Plans</Link></li>
              <li><Link to="/contact" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green flex items-center gap-2 justify-center md:justify-start"><HelpCircle size={16}/> Get Help</Link></li>
            </ul>
          </div>

          {/* Section 4: Legal & Contact */}
          <div className="space-y-8 text-center md:text-left">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Legal & Security</h4>
              <ul className="space-y-4">
                <li><Link to="/privacy" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green flex items-center gap-2 justify-center md:justify-start"><ShieldCheck size={16}/> Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/cookies" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Contact</h4>
               <a href="mailto:sachinkumar647422.office@gmail.com" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-kirana-green flex items-center gap-2 justify-center md:justify-start whitespace-nowrap tracking-tighter">
                  <Mail size={16} className="shrink-0" /> sachinkumar647422.office@gmail.com
               </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                © {currentYear} Order-Do. All rights reserved. Made with ❤️ for Indian shopkeepers
              </p>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Language:</span>
                 <div className="scale-75 origin-right">
                    <LanguageSwitcher />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </footer>
  );
}
