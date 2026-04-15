import { ArrowLeft, Scale, Shield, Users, CreditCard, Camera, Mic, AlertCircle, FileText, Lock, Globe, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../../components/ui/Footer';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  const sections = [
    {
      id: '1',
      title: '1. Introduction',
      icon: <FileText size={20} />,
      content: 'Welcome to Order-Do. These Terms and Conditions govern your use of our Progressive Web App (PWA) and related services. By accessing or using Order-Do, you agree to be bound by these terms.'
    },
    {
      id: '2',
      title: '2. Acceptance of Terms',
      icon: <Scale size={20} />,
      content: 'By using this app, you confirm that you have read, understood, and agreed to these terms. If you do not agree, please do not use the service. These terms apply to both shopkeepers (merchants) and customers (end-users).'
    },
    {
      id: '3',
      title: '3. User Accounts and Registration',
      icon: <Users size={20} />,
      content: 'Shopkeepers must register an account to manage orders and subscriptions. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.'
    },
    {
      id: '4',
      title: '4. User Responsibilities',
      icon: <Users size={20} />,
      content: '• Shopkeepers: Responsible for accurate menu pricing, order fulfillment, and maintaining customer privacy.\n• Customers: Responsible for providing accurate order details and completing payments as per the chosen method (COD/UPI).'
    },
    {
      id: '5',
      title: '5. Order Process and Payment',
      icon: <CreditCard size={20} />,
      content: 'Order-Do facilitates order placement between customers and shops. Payment is handled directly between the two parties. Order-Do does not process actual funds but tracks payment status for record-keeping.'
    },
    {
      id: '6',
      title: '6. Photo and Data Usage Policy',
      icon: <Camera size={20} />,
      content: 'The app captures a live photo of the customer for "Liveness Detection" and security. This data is strictly used for order verification and is automatically purged upon successful transaction completion as per our Privacy Policy.'
    },
    {
      id: '7',
      title: '7. Voice Recording and Speech Recognition',
      icon: <Mic size={20} />,
      content: 'Our app uses browser-based speech recognition to process orders. We do not store continuous audio recordings; only the converted text transcript is used to identify items in your order.'
    },
    {
      id: '8',
      title: '8. Subscription Plans and Payments',
      icon: <CreditCard size={20} />,
      content: 'Shopkeepers can choose from various subscription plans (Free/Pro/Enterprise). Subscriptions are non-refundable unless specified otherwise. Failure to pay may result in restricted access to premium features like Voice Assistant or KDS.'
    },
    {
      id: '9',
      title: '9. Intellectual Property Rights',
      icon: <Shield size={20} />,
      content: 'All software, designs, logos, and technology associated with Order-Do are the exclusive property of Order-Do Technology. You may not copy, modify, or reverse-engineer any part of the app.'
    },
    {
      id: '10',
      title: '10. Prohibited Activities',
      icon: <AlertCircle size={20} />,
      content: 'Users are prohibited from: using the app for illegal transactions, uploading harmful content, attempting to bypass security features, or harassing other users.'
    },
    {
      id: '11',
      title: '11. Limitation of Liability',
      icon: <Lock size={20} />,
      content: 'Order-Do is provided "as is". We are not liable for any lost profits, data loss, or indirect damages arising from the use of our service, including disputes between shopkeepers and customers.'
    },
    {
      id: '12',
      title: '12. Termination of Service',
      icon: <AlertCircle size={20} />,
      content: 'We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activities without prior notice.'
    },
    {
      id: '13',
      title: '13. Changes to Terms',
      icon: <FileText size={20} />,
      content: 'We may update these Terms & Conditions from time to time. Your continued use of the app after changes are posted constitutes acceptance of the new terms.'
    },
    {
      id: '14',
      title: '14. Governing Law (India)',
      icon: <Globe size={20} />,
      content: 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.'
    },
    {
      id: '15',
      title: '15. Contact Information',
      icon: <FileText size={20} />,
      content: 'For questions about these Terms, contact us at: support@order-do.com'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30 overflow-hidden">
      {/* Immersive Background Nodes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-secondary/5 blur-[100px] rounded-full -ml-20 -mb-20 pointer-events-none" />

      {/* Header */}
      <header className="h-20 flex items-center px-8 bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-6 max-w-7xl mx-auto w-full">
           <Button 
             variant="ghost" 
             onClick={() => navigate(-1)}
             className="w-12 h-12 !p-0 !rounded-xl bg-white/5 text-slate-400 hover:text-white"
           >
             <ArrowLeft size={24} />
           </Button>
           <div className="flex flex-col">
             <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Agreement <span className="text-brand-secondary italic">Protocol</span></h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Terms & Conditions of Service</p>
           </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-20 space-y-12 relative">
        {/* Intro Directive */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard intensity="high" className="p-10 border-brand-secondary/20 shadow-glow-secondary/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-secondary/5 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-brand-secondary/10 rounded-2xl flex items-center justify-center border border-brand-secondary/20 text-brand-secondary group-hover:scale-110 transition-transform">
                <Scale size={32} />
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                Legal <span className="text-brand-secondary">Framework</span>
              </h2>
            </div>
            <p className="text-slate-400 font-bold text-lg italic leading-relaxed">
              This document constitutes a legally binding interaction protocol between your node and Order-Do Technology. Review these operational parameters carefully before initiating system uplink.
            </p>
          </GlassCard>
        </motion.div>

        {/* Operational Sections */}
        <div className="space-y-6 pb-20">
           {sections.map((section, idx) => (
             <motion.div
               key={section.id}
               initial={{ opacity: 0, y: 15 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.05 }}
             >
                <GlassCard intensity="low" className="p-8 border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 bg-white/5 rounded-xl text-brand-secondary border border-white/5">
                      {section.icon}
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight italic">{section.title}</h3>
                  </div>
                  <div className="text-sm text-slate-400 font-bold leading-relaxed whitespace-pre-line break-all">
                    {section.content}
                  </div>
                </GlassCard>
             </motion.div>
           ))}
        </div>

        {/* Diagnostic Footer Info */}
        <div className="flex flex-col items-center gap-6 pt-10 border-t border-white/5 opacity-30 text-center">
           <div className="flex items-center gap-3">
              <Database size={14} className="text-brand-secondary" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Operational Ledger v4.2</span>
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Secure Protocol Registry // India Core</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
