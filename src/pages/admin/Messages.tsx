import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  MessageSquare, 
  Mail, 
  Trash2, 
  Search,
  X,
  Megaphone,
  ChevronRight,
  Calendar,
  Zap,
  ShieldAlert,
  Fingerprint,
  ArrowUpRight,
  Radio,
  Filter,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';

interface ContactMessage {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'critical';
  created_at: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'broadcast'>('all');
  
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    priority: 'info' as 'info' | 'warning' | 'critical'
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchAnnouncements();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setMessages(data || []);
    setLoading(false);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  };

  const handleSendBroadcast = async () => {
    if (!newBroadcast.title || !newBroadcast.message) {
      toast.error('Protocol requires header and telemetry data');
      return;
    }
    setIsSending(true);
    try {
      const { error } = await supabase.from('announcements').insert([newBroadcast]);
      if (error) throw error;
      toast.success('Omni-channel broadcast transmitted');
      setIsBroadcasting(false);
      setNewBroadcast({ title: '', message: '', priority: 'info' });
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(`Relay failure: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('EXTERMINATE: Announcement will be purged from network archives. Continue?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) {
      setAnnouncements(announcements.filter(a => a.id !== id));
      toast.success('Transmission purged');
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m));
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, is_read: true });
      }
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (!error) {
      setMessages(messages.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
      toast.success('Inquiry archived');
    }
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'unread') return !m.is_read && matchesSearch;
    if (filter === 'read') return m.is_read && matchesSearch;
    return matchesSearch;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <motion.h1 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none"
           >
             Comms <span className="text-brand-primary">Hub</span>
           </motion.h1>
           <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 flex items-center gap-2">
             <Radio size={12} className="text-brand-primary" />
             External Inquiries & Network Broadcasts
           </p>
        </div>

        <div className="flex items-center gap-4">
           <GlassCard intensity="low" className="flex items-center gap-3 px-6 h-14 border-white/20 dark:border-white/5">
              <Search className="text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search Archive..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white w-40 placeholder:text-slate-500"
              />
              <Filter size={16} className="text-slate-300 ml-2" />
           </GlassCard>

           <div className="flex p-1.5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-inner h-14 items-center">
              {(['all', 'unread', 'broadcast'] as const).map((t) => (
                <button 
                  key={t}
                  onClick={() => setFilter(t as any)}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-brand-primary text-white shadow-glow-green font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  {t} {t === 'unread' && unreadCount > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-1">{unreadCount}</span>}
                </button>
              ))}
           </div>

           <Button 
             onClick={() => setIsBroadcasting(true)}
             variant="primary"
             className="h-14 px-8 !rounded-2xl shadow-glow-green"
           >
             <Megaphone size={18} className="mr-2" /> Broadcast
           </Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
             {[1,2,3,4].map(i => <GlassCard key={i} intensity="low" className="h-28 animate-pulse border-white/10" />)}
          </div>
        ) : filter === 'broadcast' ? (
          <div className="grid grid-cols-1 gap-5">
             <AnimatePresence mode="popLayout">
                {announcements.map((ann, i) => (
                  <motion.div
                    key={ann.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <GlassCard intensity="low" className="p-6 border-white/40 dark:border-white/5 flex items-center justify-between group hover:border-brand-primary/20 transition-all relative overflow-hidden h-28">
                       <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all border shadow-inner ${ann.priority === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ann.priority === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'}`}>
                             <Megaphone size={24} />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none group-hover:text-brand-primary transition-colors">{ann.title}</h4>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{ann.message.slice(0, 100)}...</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-10">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Transmission Time</p>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{new Date(ann.created_at).toLocaleString()}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            onClick={() => deleteAnnouncement(ann.id)}
                            className="w-12 h-12 !p-0 !rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10"
                          >
                             <Trash2 size={18} />
                          </Button>
                       </div>
                       {/* Intensity gradient */}
                       <div className={`absolute top-0 right-0 w-32 h-full -z-10 blur-[60px] opacity-10 ${ann.priority === 'critical' ? 'bg-red-500' : ann.priority === 'warning' ? 'bg-amber-500' : 'bg-brand-primary'}`} />
                    </GlassCard>
                  </motion.div>
                ))}
             </AnimatePresence>
             {announcements.length === 0 && (
                <GlassCard intensity="low" className="py-24 border-dashed border-2 border-white/20 text-center space-y-6">
                   <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto opacity-20">
                      <Megaphone size={40} className="text-slate-400" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">No network-wide broadcasts archived</p>
                </GlassCard>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredMessages.map((msg, i) => (
                <motion.div 
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (!msg.is_read) markAsRead(msg.id);
                  }}
                >
                  <GlassCard 
                    intensity={!msg.is_read ? "high" : "low"} 
                    className={`p-6 border-white/40 dark:border-white/5 flex items-center justify-between group hover:border-brand-primary/20 transition-all cursor-pointer relative overflow-hidden h-28 ${!msg.is_read ? 'border-brand-primary/30 shadow-glow-green/5' : ''}`}
                  >
                     <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all border shadow-inner ${!msg.is_read ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-white/40 dark:bg-slate-950/40 text-slate-400 border-white/10 dark:border-white/5'}`}>
                           {msg.is_read ? <Inbox size={24} /> : <Mail size={24} className="animate-pulse" />}
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none group-hover:text-brand-primary transition-colors">{msg.name}</h4>
                              {!msg.is_read && (
                                <span className="px-2 py-0.5 bg-brand-primary text-white rounded-full text-[7px] font-black uppercase tracking-widest shadow-glow-green">High Priority</span>
                              )}
                           </div>
                           <p className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest mt-3 flex items-center gap-2">
                              <Fingerprint size={12} className="text-brand-primary" />
                              {msg.subject}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-10">
                        <div className="text-right hidden sm:block">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-end gap-2 text-right">
                              <Calendar size={10} /> Transmission Frame
                           </p>
                           <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                              {new Date(msg.created_at).toLocaleDateString()} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          className="w-12 h-12 !p-0 !rounded-xl bg-white/20 dark:bg-slate-900/20 border border-white/20 dark:border-white/5 group-hover:bg-brand-primary/10 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all"
                        >
                           <ChevronRight size={20} />
                        </Button>
                     </div>

                     {/* Progress indicator */}
                     {!msg.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary animate-pulse" />
                     )}
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredMessages.length === 0 && (
               <GlassCard intensity="low" className="py-24 border-dashed border-2 border-white/20 text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto opacity-20">
                     <Inbox size={40} className="text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">No inquiry streams match current filter</p>
               </GlassCard>
            )}
          </div>
        )}
      </div>

      {/* MESSAGE DETAIL MODAL */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl" onClick={() => setSelectedMessage(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl overflow-hidden"
              >
                 <GlassCard intensity="high" className="border-white/20 dark:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                    <div className="p-10 border-b border-white/10 flex items-start justify-between relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-5 blur-[40px] rounded-full" />
                       <div className="relative z-10 flex items-center gap-5">
                          <div className="w-16 h-16 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-glow-green/10">
                             <Mail size={32} />
                          </div>
                          <div>
                             <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{selectedMessage.subject}</h3>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-2">
                                Origin: <span className="text-brand-primary">{selectedMessage.name}</span>
                             </p>
                          </div>
                       </div>
                       <Button 
                         variant="ghost" 
                         onClick={() => setSelectedMessage(null)} 
                         className="w-10 h-10 !p-0 !rounded-xl text-white/40 hover:text-white"
                       >
                          <X size={20} />
                       </Button>
                    </div>

                    <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                       <div className="grid grid-cols-2 gap-6">
                          <div className="p-6 bg-white/10 dark:bg-slate-900/40 rounded-[2rem] border border-white/5 space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital Address</label>
                             <p className="font-black text-slate-900 dark:text-white text-xs break-all uppercase italic truncate hover:text-brand-primary cursor-pointer transition-colors" title={selectedMessage.email}>{selectedMessage.email}</p>
                          </div>
                          <div className="p-6 bg-white/10 dark:bg-slate-900/40 rounded-[2rem] border border-white/5 space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Voice Link</label>
                             <p className="font-black text-slate-900 dark:text-white text-xs uppercase italic">
                               {selectedMessage.phone || 'Direct Nexus Only'}
                             </p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="flex items-center justify-between px-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inquiry Telemetry</label>
                             <span className="text-[9px] font-black text-brand-primary uppercase italic tracking-widest">End-to-End Encrypted</span>
                          </div>
                          <div className="p-8 bg-white/5 dark:bg-slate-950/40 rounded-[3rem] border border-white/10 min-h-[150px] shadow-inner relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MessageSquare size={100} />
                             </div>
                             <p className="text-slate-700 dark:text-slate-300 font-bold leading-relaxed whitespace-pre-wrap italic relative z-10 text-sm">
                               "{selectedMessage.message}"
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="p-10 bg-slate-50/5 dark:bg-slate-900/40 border-t border-white/10 flex gap-6">
                       <Button 
                         variant="ghost" 
                         onClick={() => deleteMessage(selectedMessage.id)}
                         className="flex-1 h-14 !rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10 transition-all font-black uppercase tracking-widest"
                       >
                          <Trash2 size={20} className="mr-2" /> Exterminate
                       </Button>
                       <Button 
                         variant="ghost" 
                         onClick={() => setSelectedMessage(null)}
                         className="flex-1 h-14 !rounded-2xl bg-white/10 border border-white/10 text-slate-500 hover:text-white transition-all font-black uppercase tracking-widest"
                       >
                          Sync Status & Exit
                       </Button>
                       <Button 
                         variant="primary" 
                         className="flex-1 h-14 !rounded-2xl shadow-glow-green"
                         onClick={() => window.open(`mailto:${selectedMessage.email}`)}
                       >
                          Initiate Relay <ArrowUpRight size={18} className="ml-2" />
                       </Button>
                    </div>
                 </GlassCard>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BROADCAST CREATION MODAL */}
      <AnimatePresence>
        {isBroadcasting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsBroadcasting(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg overflow-hidden"
              >
                 <GlassCard intensity="high" className="p-10 border-white/20 dark:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-5 mb-10">
                       <div className="p-4 bg-brand-primary/10 rounded-[1.5rem] text-brand-primary border border-brand-primary/20 shadow-glow-green/10">
                          <Megaphone size={36} />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Global Relay</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Broadcast to all active nexus hubs</p>
                       </div>
                       <Button 
                         variant="ghost" 
                         onClick={() => setIsBroadcasting(false)} 
                         className="ml-auto w-10 h-10 !p-0 !rounded-xl text-white/40 hover:text-white"
                       >
                          <X size={20} />
                       </Button>
                    </div>

                    <div className="space-y-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Relay Header</label>
                          <input 
                             type="text" 
                             value={newBroadcast.title}
                             onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                             placeholder="System Alert: Maintenance Underway"
                             className="w-full h-14 px-6 bg-white/30 dark:bg-slate-900/50 border-2 border-white/20 dark:border-white/10 rounded-2xl outline-none focus:border-brand-primary transition-all font-black uppercase text-xs tracking-widest text-slate-800 dark:text-white"
                          />
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payload Telemetry</label>
                          <textarea 
                             value={newBroadcast.message}
                             onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                             placeholder="Synchronize your local databases... network upgrade in progress."
                             rows={4}
                             className="w-full p-6 bg-white/30 dark:bg-slate-900/50 border-2 border-white/20 dark:border-white/10 rounded-[2rem] outline-none focus:border-brand-primary transition-all font-bold text-sm text-slate-700 dark:text-slate-300"
                          />
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Alert Intensity</label>
                          <div className="grid grid-cols-3 gap-4">
                             {(['info', 'warning', 'critical'] as const).map((p) => (
                                <button 
                                  key={p}
                                  onClick={() => setNewBroadcast({ ...newBroadcast, priority: p })}
                                  className={`h-14 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${
                                     newBroadcast.priority === p 
                                       ? (p === 'info' ? 'bg-brand-primary border-brand-primary text-white shadow-glow-green/20' : p === 'warning' ? 'bg-amber-500 border-amber-500 text-white shadow-amber-500/20' : 'bg-red-500 border-red-500 text-white shadow-red-500/20') 
                                       : 'bg-transparent border-white/10 text-slate-500 hover:border-white/30'
                                  }`}
                                >
                                   {p === 'info' ? <Zap size={14} /> : p === 'warning' ? <Megaphone size={14} /> : <ShieldAlert size={14} />}
                                   {p}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4 mt-12">
                       <Button 
                         variant="ghost"
                         onClick={() => setIsBroadcasting(false)}
                         className="flex-1 h-14 !rounded-2xl font-black uppercase tracking-widest text-slate-500 border border-white/10"
                       >
                         Abort
                       </Button>
                       <Button 
                         disabled={isSending}
                         onClick={handleSendBroadcast}
                         variant="primary"
                         className="flex-2 h-14 !rounded-2xl shadow-glow-green"
                       >
                         {isSending ? 'Transmitting Relay...' : 'Execute Global Broadcast'}
                       </Button>
                    </div>
                 </GlassCard>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
