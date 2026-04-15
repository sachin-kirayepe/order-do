import { useMemo, useEffect, useState } from 'react';
import db, { type OrderHistory } from '../../db/dexie';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  IndianRupee, 
  Calendar, 
  Download, 
  FileText,
  ChevronRight,
  Medal
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { hi } from 'date-fns/locale';
import { motion } from 'framer-motion';
// Late-imported: jsPDF from 'jspdf'
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';

interface DailySalesReportProps {
  shopId: string;
}

interface ItemSummary {
  name: string;
  quantity: number;
  amount: number;
}

export default function DailySalesReport({ shopId }: DailySalesReportProps) {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  // Today's date in Hindi or English for display
  const todayFormatted = format(new Date(), "d MMMM yyyy, EEEE", { 
    locale: language === 'hi' ? hi : undefined 
  });

  useEffect(() => {
    const fetchTodayOrders = async () => {
      setLoading(true);
      const todayStart = startOfDay(new Date()).getTime();
      const todayEnd = endOfDay(new Date()).getTime();

      const todayOrders = await db.orderHistory
        .where('shopId').equals(shopId)
        .filter(order => 
          order.status === 'completed' && 
          order.completedAt >= todayStart && 
          order.completedAt <= todayEnd
        )
        .toArray();
      
      setOrders(todayOrders);
      setLoading(false);
    };

    fetchTodayOrders();
  }, [shopId]);

  // Calculations
  const stats = useMemo(() => {
    const totalSale = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = orders.length;
    
    let totalItemsCount = 0;
    const itemMap: Record<string, ItemSummary> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        // Try to parse quantity as number, fallback to 1
        const q = parseFloat(item.quantity) || 1;
        totalItemsCount += q;

        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, quantity: 0, amount: 0 };
        }
        itemMap[item.name].quantity += q;
        itemMap[item.name].amount += item.price || 0;
      });
    });

    const avgOrderValue = orderCount > 0 ? totalSale / orderCount : 0;
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalSale,
      orderCount,
      totalItemsCount,
      avgOrderValue,
      topItems
    };
  }, [orders]);

  // Export JSON
  const exportJSON = () => {
    const data = {
      date: format(new Date(), 'yyyy-MM-dd'),
      shopId,
      stats: {
        totalSale: stats.totalSale,
        orderCount: stats.orderCount,
        totalItems: stats.totalItemsCount,
        avgOrderValue: stats.avgOrderValue,
      },
      topItems: stats.topItems,
      orders: orders.map(o => ({
        id: o.id,
        customer: 'Encrypted', // Privacy
        total: o.total,
        time: format(o.completedAt, 'HH:mm'),
        items: o.items
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report-${format(new Date(), 'dd-MM-yyyy')}.json`;
    a.click();
    toast.success(t('report.jsonDownloadSuccess'));
  };

  // Export PDF
  const exportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      const dateStr = format(new Date(), 'dd MMM yyyy');
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(21, 128, 61); // kirana-green
      doc.text('Daily Sales Report', 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Shop ID: ${shopId}`, 14, 30);
      doc.text(`Date: ${dateStr}`, 14, 37);
      
      // Stats Table
      (doc as any).autoTable({
        startY: 45,
        head: [['Metric', 'Value']],
        body: [
          ['Total Sale', `Rs. ${stats.totalSale.toFixed(2)}`],
          ['Total Orders', stats.orderCount.toString()],
          ['Total Items Sold', stats.totalItemsCount.toFixed(1)],
          ['Average Order Value', `Rs. ${stats.avgOrderValue.toFixed(2)}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [21, 128, 61] }
      });
      
      // Top Items Table
      doc.setFontSize(16);
      doc.text('Top 5 Selling Items', 14, (doc as any).lastAutoTable.finalY + 15);
      
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Item Name', 'Quantity', 'Amount (Rs.)']],
        body: stats.topItems.map(item => [
          item.name,
          item.quantity.toFixed(1),
          item.amount.toFixed(2)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [21, 128, 61] }
      });
      
      doc.save(`Report-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      toast.success(t('report.pdfSaveSuccess'));
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error(t('report.pdfError'));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-12 h-12 border-4 border-kirana-green border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-kirana-green/10 flex items-center justify-center text-kirana-green">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('report.title')}</h2>
            <p className="text-sm text-slate-400 font-medium">{todayFormatted}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={exportJSON}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
          >
            <Download size={16} /> JSON
          </button>
          <button 
            onClick={exportPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-kirana-green text-white rounded-xl font-semibold text-sm hover:bg-kirana-green-dark shadow-lg shadow-kirana-green/20 transition-all active:scale-95"
          >
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('report.totalSale'), value: `₹${stats.totalSale.toLocaleString()}`, sub: t('report.revenue'), icon: TrendingUp, color: 'text-kirana-green', bg: 'bg-kirana-green/10' },
          { label: t('report.orderCount'), value: stats.orderCount, sub: t('report.customers'), icon: ShoppingCart, color: 'text-kirana-orange', bg: 'bg-kirana-orange/10' },
          { label: t('report.totalItems'), value: stats.totalItemsCount.toFixed(0), sub: t('report.items'), icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('report.avgOrder'), value: `₹${stats.avgOrderValue.toFixed(0)}`, sub: t('report.perOrder'), icon: IndianRupee, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-4`}>
              <item.icon size={20} />
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{item.value}</p>
            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">{item.label}</p>
            <p className="text-[10px] text-slate-300 dark:text-slate-500 mt-0.5">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Items List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Medal size={18} className="text-yellow-500" /> {t('report.topItems')}
          </h3>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-400 px-2 py-1 rounded-full uppercase font-bold tracking-tighter">{t('report.mostSold')}</span>
        </div>
        
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {stats.topItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package size={40} className="mx-auto mb-3 opacity-20" />
              <p>{t('report.noItemsToday')}</p>
            </div>
          ) : (
            stats.topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{item.quantity.toFixed(1)} {t('report.unitSold')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-kirana-green">₹{item.amount.toLocaleString()}</p>
                  <ChevronRight size={14} className="ml-auto text-slate-300 mt-1" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Visual Footer Tip */}
      <div className="bg-gradient-to-r from-kirana-green/5 to-transparent p-4 rounded-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-kirana-green shadow-sm shrink-0">
          <TrendingUp size={14} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('report.footerTip')}
        </p>
      </div>
    </div>
  );
}
