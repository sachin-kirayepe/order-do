import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft, Globe, Lock, Trash2, Eye, MessageSquare, Cpu, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/ui/Footer';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';

interface LegalSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
}

export default function PrivacyPolicy() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const navigate = useNavigate();

  const sections: Record<'en' | 'hi', LegalSection[]> = {
    en: [
      {
        id: 'intro',
        title: '1. Introduction',
        icon: <Shield size={18} />,
        content: `Welcome to Order-Do. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our PWA (Progressive Web App).`
      },
      {
        id: 'collect',
        title: '2. Information We Collect',
        icon: <Eye size={18} />,
        content: `We collect the following types of information:
        • Personal Information: Name, Phone Number, and Delivery Address.
        • Live Photo: Collected for liveness detection and security during the ordering process.
        • Voice Data: We use microphone access to process your voice commands for ordering.
        • Device Data: Limited technical data like browser type and operating system for app performance.`
      },
      {
        id: 'how_collect',
        title: '3. How We Collect Information',
        icon: <Globe size={18} />,
        content: `Information is collected directly from you when you:
        • Take a live photo during the order flow.
        • Speak into the microphone.
        • Manually enter your name, phone, or address.`
      },
      {
        id: 'usage',
        title: '4. How We Use Your Information',
        icon: <Globe size={18} />,
        content: `Your data is used solely to:
        • Authenticate your order (via photo).
        • Process your order items (via voice/text).
        • Facilitate delivery to your provided address.
        • Notify shopkeepers of new pending orders.`
      },
      {
        id: 'storage',
        title: '5. Data Storage',
        icon: <Lock size={18} />,
        content: `We use a hybrid storage model:
        • Local Storage (Dexie/IndexedDB): Your order data is stored on your device for fast access.
        • Supabase: Shop profiles and subscription data are securely stored on our cloud database.`
      },
      {
        id: 'sharing',
        title: '6. Data Sharing',
        icon: <Lock size={18} />,
        content: `We do NOT sell, trade, or rent your personal information to third parties. Data is only shared with the specific shopkeeper you are ordering from.`
      },
      {
        id: 'deletion',
        title: '7. Data Deletion Policy',
        icon: <Trash2 size={18} />,
        content: `We prioritize your privacy. Once an order is marked as "Done" or "Paid" by the shopkeeper:
        • Your live photo and personal identifiers (Name/Address) are permanently deleted from our active records.
        • Only a "Privacy Proof" (transaction hash) is kept for shopkeeper records.`
      },
      {
        id: 'cookies',
        title: '8. Cookies & Local Storage',
        icon: <Lock size={18} />,
        content: `We use Local Storage to remember your preferences (Theme, Language) and to keep your session active. We do not use third-party tracking cookies.`
      },
      {
        id: 'security',
        title: '9. Security Measures',
        icon: <Lock size={18} />,
        content: `We implement strict security layers (Encrypted local storage and Secure Canvas) to prevent unauthorized access to your data while it is being processed.`
      },
      {
        id: 'children',
        title: '10. Children\'s Privacy',
        icon: <Shield size={18} />,
        content: `Our services are not intended for children under 13. We do not knowingly collect data from children.`
      },
      {
        id: 'changes',
        title: '11. Changes to This Policy',
        icon: <Shield size={18} />,
        content: `We may update this policy occasionally. Any changes will be posted on this page with an updated "Last Modified" date.`
      },
      {
        id: 'contact',
        title: '12. Contact us',
        icon: <MessageSquare size={18} />,
        content: `For any privacy-related queries, please contact us at: support@order-do.com`
      }
    ],
    hi: [
      {
        id: 'intro',
        title: '1. प्रस्तावना (Introduction)',
        icon: <Shield size={18} />,
        content: `Order-Do में आपका स्वागत है। हम आपकी गोपनीयता (Privacy) का सम्मान करते हैं और आपके डेटा की सुरक्षा के लिए प्रतिबद्ध हैं। यह नीति बताती है कि हम आपकी जानकारी का उपयोग कैसे करते हैं।`
      },
      {
        id: 'collect',
        title: '2. जानकारी जो हम एकत्र करते हैं',
        icon: <Eye size={18} />,
        content: `हम निम्नलिखित जानकारी एकत्र करते हैं:
        • व्यक्तिगत जानकारी: नाम, फोन नंबर और पता।
        • लाइव फोटो: सुरक्षा और पहचान के लिए।
        • वॉइस डेटा: ऑर्डर लेने के लिए आपके वॉइस कमांड का उपयोग किया जाता है।
        • डिवाइस डेटा: ऐप के प्रदर्शन को बेहतर बनाने के लिए सीमित तकनीकी डेटा।`
      },
      {
        id: 'how_collect',
        title: '3. हम जानकारी कैसे एकत्र करते हैं',
        icon: <Globe size={18} />,
        content: `जानकारी सीधे आपसे एकत्र की जाती है जब आप:
        • ऑर्डर के दौरान फोटो लेते हैं।
        • माइक्रोफोन में बोलते हैं।
        • अपना विवरण मैनुअल रूप से भरते हैं।`
      },
      {
        id: 'usage',
        title: '4. जानकारी का उपयोग',
        icon: <Globe size={18} />,
        content: `आपके डेटा का उपयोग केवल इन कार्यों के लिए किया जाता है:
        • आपके ऑर्डर की पुष्टि करना।
        • ऑर्डर को प्रोसेस करना।
        • आपके पते पर डिलीवरी सुनिश्चित करना।`
      },
      {
        id: 'storage',
        title: '5. डेटा स्टोरेज',
        icon: <Lock size={18} />,
        content: `हम सुरक्षित तरीके से डेटा स्टोर करते हैं:
        • लोकल स्टोरेज: फ़ास्ट एक्सेस के लिए आपके डिवाइस पर।
        • क्लाउड डेटाबेस (Supabase): दुकानदार की प्रोफाइल और सब्सक्रिप्शन के लिए।`
      },
      {
        id: 'sharing',
        title: '6. डेटा साझा करना',
        icon: <Lock size={18} />,
        content: `हम आपकी जानकारी किसी भी तीसरे पक्ष (Third-party) को नहीं बेचते हैं। जानकारी केवल उसी दुकानदार के साथ साझा की जाती है जहाँ आप ऑर्डर दे रहे हैं।`
      },
      {
        id: 'deletion',
        title: '7. डेटा हटाने की नीति (Deletion Policy)',
        icon: <Trash2 size={18} />,
        content: `भुगतान (Payment) सफल होने के बाद:
        • आपकी फोटो और निजी जानकारी हमारे सक्रिय रिकॉर्ड से स्थायी रूप से हटा दी जाती है।
        • दुकानदार के पास केवल लेनदेन का एक गुप्त प्रमाण (Privacy Proof) रहता है।`
      },
      {
        id: 'cookies',
        title: '8. कुकीज़ और लोकल स्टोरेज',
        icon: <Lock size={18} />,
        content: `हम आपकी पसंद (थीम, भाषा) को याद रखने के लिए लोकल स्टोरेज का उपयोग करते हैं।`
      },
      {
        id: 'security',
        title: '9. सुरक्षा उपाय',
        icon: <Lock size={18} />,
        content: `हम आपके डेटा को सुरक्षित रखने के लिए एन्क्रिप्शन और अन्य सुरक्षा तकनीकों का उपयोग करते हैं।`
      },
      {
        id: 'children',
        title: '10. बच्चों की गोपनीयता',
        icon: <Shield size={18} />,
        content: `हमारी सेवाएँ 13 वर्ष से कम उम्र के बच्चों के लिए नहीं हैं।`
      },
      {
        id: 'changes',
        title: '11. नीति में बदलाव',
        icon: <Shield size={18} />,
        content: `हम समय-समय पर इस नीति में अपडेट कर सकते हैं। बदलाव इसी पेज पर दिखाए जाएंगे।`
      },
      {
        id: 'contact',
        title: '12. संपर्क करें (Contact Us)',
        icon: <MessageSquare size={18} />,
        content: `किसी भी प्रश्न के लिए हमें यहाँ संपर्क करें: support@order-do.com`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30 overflow-hidden">
      {/* Immersive Background Nodes */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-primary/5 blur-[100px] rounded-full -ml-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-secondary/5 blur-[100px] rounded-full -mr-20 -mb-20 pointer-events-none" />

      {/* Header */}
      <header className="h-20 flex items-center px-8 bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
           <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="w-12 h-12 !p-0 !rounded-xl bg-white/5 text-slate-400 hover:text-white"
              >
                <ArrowLeft size={24} />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Privacy <span className="text-brand-primary italic">Protocol</span></h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">{lang === 'en' ? 'Last updated: April 2026' : 'अंतिम अपडेट: अप्रैल २०२६'}</p>
              </div>
           </div>
           
           <Button 
             onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
             variant="ghost"
             className="h-12 px-6 bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest italic flex items-center gap-3 hover:bg-white/10"
           >
              <Globe size={14} className="text-brand-primary" />
              {lang === 'en' ? 'हिन्दी' : 'English'}
           </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-20 space-y-12 relative">
        {/* Intro Directive */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard intensity="high" className="p-10 border-brand-primary/20 shadow-glow-green/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 text-brand-primary group-hover:scale-110 transition-transform">
                <Shield size={32} />
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                {lang === 'en' ? 'Core <span class="text-brand-primary">Integrity</span>' : 'मूल <span class="text-brand-primary">अखंडता</span>'}
              </h2>
            </div>
            <p className="text-slate-300 font-bold text-lg leading-relaxed">
              {lang === 'en' 
                ? 'At Order-Do, we believe that your data belongs to ONLY you. We have built our architecture around the principle of "Implicit Privacy"—where sensitive telemetry is purged automatically once operational requirements are fulfilled.'
                : 'Order-Do में, हम मानते हैं कि आपका डेटा केवल "आपका" है। हमने "इम्प्लिसिट प्राइवेसी" के सिद्धांत पर अपनी तकनीक बनाई है—जहाँ आपका डेटा काम पूरा होते ही अपने आप हटा दिया जाता है।'}
            </p>
          </GlassCard>
        </motion.div>

        {/* Policy Protocols */}
        <div className="space-y-6 pb-20">
           <AnimatePresence mode="wait">
             <motion.div
               key={lang}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-6"
             >
                {sections[lang].map((section, i) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard intensity="low" className="p-8 border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-2.5 bg-white/5 rounded-xl text-brand-primary border border-white/5">
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
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Diagnostic Footer Info */}
        <div className="flex flex-col items-center gap-6 pt-10 border-t border-white/5 opacity-30">
           <div className="flex items-center gap-3">
              <Cpu size={14} className="text-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Data Protection Protocol v4.0</span>
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Secure Ledger // India Core Archive</p>
        </div>
      </main>

      {/* Persistence Token */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-10 right-10 p-5 bg-slate-900/80 backdrop-blur-2xl text-white rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10 z-50 group hover:border-brand-primary/40 transition-all"
      >
        <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shadow-glow-green/10 group-hover:scale-110 transition-transform">
          <Fingerprint size={20} />
        </div>
        <div className="flex flex-col">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Trust Verified</p>
           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1 italic opacity-60">Verified Node</p>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}
