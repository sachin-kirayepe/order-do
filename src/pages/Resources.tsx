import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  BookOpen, 
  X,
  Sparkles,
  Database,
  Cpu,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/ui/Footer';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  category: 'Shopkeeper' | 'Customer' | 'Tips' | 'Updates';
  readTime: string;
  date: string;
}

const articles: Article[] = [
  {
    id: 1,
    title: "How to Set Up Your QR Code in Less Than 1 Minute",
    excerpt: "Learn the quick steps to generate and print your shop's unique QR code to start receiving orders instantly.",
    category: 'Shopkeeper',
    readTime: "2 min read",
    date: "Apr 05, 2026"
  },
  {
    id: 2,
    title: "5 Ways Voice Ordering Can Save Time for Your Kirana Store",
    excerpt: "Discover how letting customers speak their orders can reduce long queues and manual writing errors.",
    category: 'Shopkeeper',
    readTime: "4 min read",
    date: "Apr 03, 2026"
  },
  {
    id: 3,
    title: "Why Live Photo Verification Makes Ordering Safer and Faster",
    excerpt: "Find out how a simple selfie helps shopkeepers verify customers and avoid fake or prank orders.",
    category: 'Tips',
    readTime: "3 min read",
    date: "Apr 02, 2026"
  },
  {
    id: 4,
    title: "Counter Mode vs Table Mode – Which One is Right for You?",
    excerpt: "A comparison guide to help you choose the best ordering setup for your kirana shop or restaurant.",
    category: 'Shopkeeper',
    readTime: "5 min read",
    date: "Mar 30, 2026"
  },
  {
    id: 5,
    title: "Beginner’s Guide: How to Place Your First Order on Order-Do",
    excerpt: "New to the app? Follow this simple visual guide to scanning, speaking, and placing your first order.",
    category: 'Customer',
    readTime: "3 min read",
    date: "Mar 28, 2026"
  },
  {
    id: 6,
    title: "How Shopkeepers Can Manage Multiple Counters Easily",
    excerpt: "Tips for larger shops to handle peak hours by using multiple QR codes across different counters.",
    category: 'Shopkeeper',
    readTime: "4 min read",
    date: "Mar 25, 2026"
  },
  {
    id: 7,
    title: "Tips to Get Faster Delivery Using Order-Do",
    excerpt: "Encourage your customers to use voice ordering correctly for immediate shop notifications.",
    category: 'Customer',
    readTime: "2 min read",
    date: "Mar 22, 2026"
  },
  {
    id: 8,
    title: "Understanding Free vs Paid Plans – Which One Should You Choose?",
    excerpt: "Breakdown of features in the Silver, Gold, and Platinum plans to help you scale your business.",
    category: 'Updates',
    readTime: "5 min read",
    date: "Mar 20, 2026"
  }
];

export default function Resources() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | Article['category']>('All');
  const [showToast, setShowToast] = useState(false);

  const categories: ('All' | Article['category'])[] = ['All', 'Shopkeeper', 'Customer', 'Tips', 'Updates'];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleReadMore = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30 overflow-hidden">
      {/* Immersive Background Nodes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/5 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none" />

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
             <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Knowledge <span className="text-brand-primary italic">Vault</span></h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Protocol Guides & Updates</p>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32 space-y-24 relative">
        {/* Hero Section */}
        <section className="text-center space-y-12 max-w-4xl mx-auto relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-primary/10 blur-[100px] rounded-full -z-10" />
           
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-brand-primary border border-brand-primary/20 shadow-glow-green/10 mb-8"
           >
             <BookOpen size={40} />
           </motion.div>

           <div className="space-y-6">
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic leading-none tracking-tighter">
                Master the <span className="text-brand-primary">Nexus</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-400 font-bold max-w-2xl mx-auto italic leading-relaxed">
                Precision-crafted tactical guides to optimize your storefront infrastructure and elevate the customer interaction layer.
              </p>
           </div>
        </section>

        {/* Search & Filters */}
        <section className="space-y-10 max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-40 transition-opacity" />
            <div className="relative">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors" size={24} />
               <input 
                 type="text" 
                 placeholder="Search protocols, tactics, or updates..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-6 py-6 bg-white/5 border-2 border-white/5 rounded-[2.5rem] outline-none focus:border-brand-primary/40 shadow-inner group-focus-within:bg-white/10 transition-all font-black text-sm uppercase tracking-widest placeholder:text-slate-600"
               />
               {searchTerm && (
                 <button 
                   onClick={() => setSearchTerm('')}
                   className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-slate-400"
                 >
                   <X size={20} />
                 </button>
               )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic transition-all border
                  ${activeCategory === cat 
                    ? 'bg-brand-primary text-white border-brand-primary shadow-glow-green' 
                    : 'bg-white/5 text-slate-500 border-white/5 hover:border-brand-primary/40 hover:text-brand-primary hover:bg-brand-primary/5'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Articles Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard
                  intensity="low"
                  className="p-8 flex flex-col h-full border-white/5 group hover:border-brand-primary/20 transition-all relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className={`
                      px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest italic border
                      ${article.category === 'Shopkeeper' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        article.category === 'Customer' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' :
                        article.category === 'Tips' ? 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}
                    `}>
                      {article.category}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <Clock size={14} className="opacity-50" />
                      {article.readTime}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white mb-4 italic leading-tight group-hover:text-brand-primary transition-colors relative z-10 uppercase tracking-tighter">
                    {article.title}
                  </h3>
                  
                  <p className="text-sm text-slate-500 font-bold italic leading-relaxed mb-8 line-clamp-3 relative z-10 group-hover:text-slate-400 transition-colors">
                    {article.excerpt}
                  </p>

                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                      <Calendar size={14} className="opacity-50" />
                      {article.date}
                    </div>
                    <Button 
                      variant="ghost"
                      onClick={handleReadMore}
                      className="!p-0 h-10 w-10 !rounded-xl text-brand-primary hover:bg-brand-primary/10 flex items-center justify-center group/btn"
                    >
                      <ArrowUpRight size={20} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </Button>
                  </div>
                  
                  {/* Internal Glow Effect */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-primary/5 blur-[40px] rounded-full group-hover:bg-brand-primary/10 transition-colors" />
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {/* CTA Section */}
        <section className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary border-brand-primary/20 to-brand-secondary border-brand-secondary/20 rounded-[4.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
           
           <GlassCard intensity="high" className="p-16 md:p-24 text-center space-y-12 relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/5 blur-[130px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-secondary/5 blur-[130px] rounded-full pointer-events-none" />
              
              <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center text-brand-primary mb-4 animate-pulse">
                 <Cpu size={40} />
              </div>

              <div className="space-y-6 max-w-2xl">
                <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Persistent Support</h3>
                <p className="text-slate-400 font-bold text-xl italic leading-relaxed">
                  If the Knowledge Vault fails to resolve your operational query, initiate a direct link with our support specialists.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-lg">
                <Button 
                  onClick={() => navigate('/contact')}
                  variant="primary"
                  className="h-16 flex-1 !rounded-2xl shadow-glow-green text-xs font-black uppercase tracking-[0.3em] italic"
                >
                  Initialize Relay
                </Button>
                <Button 
                  onClick={handleReadMore}
                  variant="ghost"
                  className="h-16 flex-1 !rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-black uppercase tracking-[0.3em] italic hover:bg-white/10"
                >
                  Diagnostic FAQ
                </Button>
              </div>
           </GlassCard>
        </section>

        {/* Footer Statistics/Info */}
        <div className="flex flex-col items-center gap-6 pt-10 border-t border-white/5">
           <div className="flex items-center gap-8 opacity-20">
              <div className="flex items-center gap-2">
                 <Layers size={14} className="text-brand-primary" />
                 <span className="text-[9px] font-black uppercase tracking-widest italic">Node v4.2.0</span>
              </div>
              <div className="flex items-center gap-2">
                 <Database size={14} className="text-brand-secondary" />
                 <span className="text-[9px] font-black uppercase tracking-widest italic">Distributed Ledger</span>
              </div>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Secure Protocol Archive // India Core</p>
        </div>
      </main>

      {/* Dynamic Notification Frame */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%', transition: { duration: 0.2 } }}
            className="fixed bottom-12 left-1/2 z-[100] w-[400px]"
          >
            <GlassCard intensity="high" className="p-6 border-brand-primary/40 flex items-center gap-6 shadow-glow-green/20">
              <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-inner shrink-0">
                <Sparkles size={24} className="animate-spin-slow" />
              </div>
              <div>
                <p className="text-xs font-black uppercase italic tracking-[0.2em] text-white">Cache Miss: Compiling Guide</p>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Resource is being synthesized for your node.</p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
