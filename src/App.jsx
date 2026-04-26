import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Settings, PlusCircle, PiggyBank, X, Settings2, ChevronDown, ChevronRight, ChevronLeft, MoonStar, Archive, ArrowLeft, Trash2, Download, Upload } from 'lucide-react';

const BASE_AMOUNT = 1000;
const CYCLE_LENGTH = 28;

function App() {
  const [startDate, setStartDate] = useState(null);
  const [daysActive, setDaysActive] = useState(0);
  
  const [exchangeRate, setExchangeRate] = useState(300);
  const [userTx, setUserTx] = useState([]); 
  
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  
  // By default, let's keep today's date expanded
  const [expandedDates, setExpandedDates] = useState({});
  
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState('expense');

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedArchiveDate, setSelectedArchiveDate] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let storedDate = localStorage.getItem('manifestationStartDate');
    if (!storedDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      storedDate = now.toISOString();
      localStorage.setItem('manifestationStartDate', storedDate);
    }
    setStartDate(new Date(storedDate));

    const storedRate = localStorage.getItem('manifestationRate');
    if (storedRate) setExchangeRate(Number(storedRate));

    const storedTx = localStorage.getItem('manifestationTx');
    if (storedTx) setUserTx(JSON.parse(storedTx));
  }, []);

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    setExpandedDates(prev => (prev[todayStr] === undefined ? { ...prev, [todayStr]: true } : prev));
  }, []);

  useEffect(() => {
    if (startDate) {
      const calculateDays = () => {
        const now = new Date();
        // Use calendar-date diff so the day rolls over at midnight,
        // regardless of what time the app was first opened.
        const startLocal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffTime = nowLocal - startLocal;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDaysActive(diffDays);
      };

      calculateDays();
      // Re-check once per minute so day flips right at midnight
      const interval = setInterval(calculateDays, 1000 * 60);
      return () => clearInterval(interval);
    }
  }, [startDate]);

  const saveExchangeRate = (val) => {
    setExchangeRate(val);
    localStorage.setItem('manifestationRate', val);
  };

  const handleAddTx = (e) => {
    e.preventDefault();
    if (!txDesc || !txAmount) return;
    
    const newTx = {
      id: Date.now().toString(),
      desc: txDesc,
      amountLKR: Number(txAmount),
      type: txType,
      date: new Date().toISOString()
    };
    
    const updated = [newTx, ...userTx];
    setUserTx(updated);
    localStorage.setItem('manifestationTx', JSON.stringify(updated));
    
    setTxDesc('');
    setTxAmount('');
    setShowTxModal(false);
  };

  const toggleDateExpansion = (dateStr) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const handleDeleteTx = (id) => {
    const updated = userTx.filter(t => t.id !== id);
    setUserTx(updated);
    localStorage.setItem('manifestationTx', JSON.stringify(updated));
  };

  const handleToggleManifested = (id) => {
    const updated = userTx.map(t => t.id === id ? { ...t, manifested: !t.manifested } : t);
    setUserTx(updated);
    localStorage.setItem('manifestationTx', JSON.stringify(updated));
  };

  const handleExport = () => {
    const data = {
      startDate: localStorage.getItem('manifestationStartDate'),
      rate: localStorage.getItem('manifestationRate'),
      transactions: localStorage.getItem('manifestationTx'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abundance-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.startDate) {
          localStorage.setItem('manifestationStartDate', data.startDate);
          setStartDate(new Date(data.startDate));
        }
        if (data.rate) {
          localStorage.setItem('manifestationRate', data.rate);
          setExchangeRate(Number(data.rate));
        }
        if (data.transactions) {
          localStorage.setItem('manifestationTx', data.transactions);
          setUserTx(JSON.parse(data.transactions));
        }
      } catch (err) {
        alert('That backup file does not look right. Try again?');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const BASE_URL = import.meta.env.BASE_URL;

  if (!startDate) return null;

  // Cycle math: every 28 days the daily deposit doubles.
  const cyclesCompleted = Math.floor((daysActive - 1) / CYCLE_LENGTH);
  const currentCycle = cyclesCompleted + 1;
  const dayOfCycle = ((daysActive - 1) % CYCLE_LENGTH) + 1;
  const todayDailyUSD = BASE_AMOUNT * Math.pow(2, currentCycle - 1);

  // Sum of past full cycles (geometric series) plus partial current cycle.
  const pastCyclesUSD = CYCLE_LENGTH * BASE_AMOUNT * (Math.pow(2, cyclesCompleted) - 1);
  const currentCycleSoFarUSD = dayOfCycle * todayDailyUSD;
  const totalDepositedUSD = pastCyclesUSD + currentCycleSoFarUSD;
  const totalDepositedLKR = totalDepositedUSD * exchangeRate;

  const totalSpentLKR = userTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amountLKR, 0);
  const totalSavingsLKR = userTx.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amountLKR, 0);

  const currentBalanceLKR = totalDepositedLKR - totalSpentLKR - totalSavingsLKR;

  const systemDeposits = Array.from({ length: daysActive }).map((_, i) => {
    const day = daysActive - i;
    const cycleForDay = Math.ceil(day / CYCLE_LENGTH);
    const dayOfThatCycle = ((day - 1) % CYCLE_LENGTH) + 1;
    const usd = BASE_AMOUNT * Math.pow(2, cycleForDay - 1);
    const lkr = usd * exchangeRate;
    const txDate = new Date(startDate);
    txDate.setDate(txDate.getDate() + day - 1);

    return {
      id: `dep-${day}`,
      desc: `Abundance Flow · Cycle ${cycleForDay} · Day ${dayOfThatCycle}`,
      amountLKR: lkr,
      amountUSD: usd,
      type: 'deposit',
      date: txDate.toISOString()
    };
  });

  const allHistory = [...userTx, ...systemDeposits];

  // Group by Date string (e.g., "Apr 25, 2026")
  const groupedHistory = allHistory.reduce((groups, tx) => {
    const dateStr = new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (!groups[dateStr]) {
      groups[dateStr] = {
        transactions: [],
        totalIn: 0,
        totalOut: 0,
      };
    }
    groups[dateStr].transactions.push(tx);
    if (tx.type === 'deposit') {
      groups[dateStr].totalIn += tx.amountLKR;
    } else {
      groups[dateStr].totalOut += tx.amountLKR;
    }
    return groups;
  }, {});

  // Sort groups by date descending
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => new Date(b) - new Date(a));
  
  const todaysDateStr = sortedDates[0];

  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderDateGroup = (dateStr) => {
    const group = groupedHistory[dateStr];
    const isExpanded = expandedDates[dateStr];
    
    return (
      <div key={dateStr} className="bg-phthalo-800/30 border border-phthalo-700/50 rounded-xl overflow-hidden transition-all duration-300">
        <button 
          onClick={() => toggleDateExpansion(dateStr)}
          className="w-full p-4 flex items-center justify-between hover:bg-phthalo-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-oldgold-500/70">
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
            <span className="font-semibold text-gray-200">{dateStr}</span>
          </div>
          <div className="text-right text-sm">
            {group.totalIn > 0 && <span className="text-emerald-400 font-medium mr-2">+{formatCurrency(group.totalIn)}</span>}
          </div>
        </button>
        
        {isExpanded && (
          <div className="bg-phthalo-900/50 p-2 border-t border-phthalo-800/50">
            {group.transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(tx => (
              <div key={tx.id} className={`flex justify-between items-center p-3 border-b border-phthalo-800/30 last:border-0 ${tx.manifested ? 'bg-oldgold-500/5' : ''}`}>
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-1.5">
                    {tx.manifested && <Sparkles className="w-3.5 h-3.5 text-oldgold-400 shrink-0" />}
                    <p className={`text-sm font-medium truncate ${tx.manifested ? 'text-oldgold-300' : 'text-gray-300'}`}>{tx.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right whitespace-nowrap text-sm">
                    {tx.type === 'deposit' && (
                      <p className="font-semibold text-emerald-400">+{formatCurrency(tx.amountLKR)}</p>
                    )}
                    {tx.type === 'expense' && (
                      <p className="font-semibold text-red-400/80">-{formatCurrency(tx.amountLKR)}</p>
                    )}
                    {tx.type === 'savings' && (
                      <p className="font-semibold text-blue-300">-{formatCurrency(tx.amountLKR)}</p>
                    )}
                  </div>
                  {tx.type !== 'deposit' && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        onClick={() => handleToggleManifested(tx.id)}
                        title={tx.manifested ? 'Mark as not yet manifested' : 'Mark as manifested'}
                        className={`p-1.5 rounded-md transition-colors ${tx.manifested ? 'text-oldgold-400 hover:text-oldgold-300' : 'text-phthalo-700 hover:text-oldgold-400'}`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTx(tx.id)}
                        title="Delete"
                        className="p-1.5 rounded-md text-phthalo-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Calendar Helpers
  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const renderCalendarGrid = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const days = [];
    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    // Header row
    dayLabels.forEach(label => {
      days.push(<div key={`header-${label}`} className="text-center text-xs font-semibold text-oldgold-500/60 uppercase py-2">{label}</div>);
    });

    // Empty slots before 1st day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(year, month, i);
      const dateStr = currentDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const hasActivity = groupedHistory[dateStr] !== undefined;
      
      days.push(
        <button 
          key={i} 
          onClick={() => hasActivity && setSelectedArchiveDate(dateStr)}
          disabled={!hasActivity}
          className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
            hasActivity 
              ? 'hover:bg-phthalo-700/50 cursor-pointer border border-oldgold-500/20 bg-phthalo-800/50 text-gray-100 shadow-[0_0_10px_rgba(229,193,88,0.1)]' 
              : 'text-phthalo-700/40 cursor-default'
          }`}
        >
          <span className={`text-sm font-medium ${hasActivity ? 'text-gray-100' : ''}`}>{i}</span>
          {hasActivity && <div className="w-1.5 h-1.5 rounded-full bg-oldgold-500 mt-1 shadow-[0_0_5px_#E5C158]" />}
        </button>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-md mx-auto flex flex-col gap-6 pb-24 font-sans text-gray-100 selection:bg-oldgold-500/30">
      
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-oldgold-400">
            <MoonStar className="text-oldgold-500 w-5 h-5" />
            High Magick
          </h1>
          <p className="text-sm text-oldgold-500/60 tracking-wider uppercase text-xs mt-1">Cycle {currentCycle} · Day {dayOfCycle}</p>
        </div>
        <button onClick={() => setShowSettingsModal(true)} className="w-10 h-10 rounded-full bg-phthalo-800 border border-oldgold-500/30 flex items-center justify-center hover:bg-phthalo-700 transition-colors shadow-lg shadow-phthalo-900/50">
          <Settings className="text-oldgold-500/80 w-5 h-5" />
        </button>
      </header>

      <section className="glass-panel p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-oldgold-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        
        <p className="text-sm text-oldgold-400/80 font-medium mb-2 z-10 tracking-widest uppercase">Active Balance</p>
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight z-10 mb-2 text-center break-all text-oldgold-400 drop-shadow-md">
          {formatCurrency(currentBalanceLKR)}
        </h2>
      </section>

      <section className="grid grid-cols-2 gap-4">
        {/* Dragon Hoard */}
        <div className="bg-phthalo-800/50 border border-phthalo-700/50 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-blue-300">
            <img src={`${BASE_URL}dragon.png`} className="w-8 h-8 object-contain mix-blend-screen" alt="Dragon" />
            <span className="font-semibold tracking-wide text-sm">Dragon Hoard</span>
          </div>
          <p className="text-xl font-bold break-all text-blue-200">{formatCurrency(totalSavingsLKR)}</p>
        </div>

        {/* Today's Flow */}
        <div className="bg-phthalo-800/50 border border-phthalo-700/50 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-oldgold-400">
            <img src={`${BASE_URL}manta.png`} className="w-8 h-8 object-contain mix-blend-screen -scale-x-100" alt="Manta Ray" />
            <span className="font-semibold tracking-wide text-sm">Today's Flow</span>
          </div>
          <p className="text-xl font-bold break-all text-oldgold-400">{formatCurrency(todayDailyUSD * exchangeRate)}</p>
        </div>
      </section>

      <section className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <img src={`${BASE_URL}cat.png`} className="w-6 h-6 object-contain rounded-full" alt="Black Cat" />
            <h3 className="text-lg font-semibold text-oldgold-400">Today's Ledger</h3>
          </div>
          <button 
            onClick={() => {
              setCalendarDate(new Date()); // Reset to current month on open
              setSelectedArchiveDate(null);
              setShowArchiveModal(true);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-oldgold-500 hover:text-oldgold-400 transition-colors uppercase tracking-widest bg-phthalo-800/50 px-3 py-1.5 rounded-lg border border-phthalo-700/50"
          >
            <Archive className="w-3.5 h-3.5" />
            Archives
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {todaysDateStr ? (
            renderDateGroup(todaysDateStr)
          ) : (
            <p className="text-center text-phthalo-700 text-sm py-4">No flow recorded yet.</p>
          )}
        </div>
      </section>

      {/* Ancient Dragon */}
      <div className="flex justify-center mt-8 mb-4 opacity-80 mix-blend-screen pointer-events-none">
        <img src={`${BASE_URL}ancient_dragon.png`} className="w-full max-w-sm object-contain" alt="Ancient Dragon" />
      </div>

      <div className="fixed bottom-6 right-6 z-20">
        <button 
          onClick={() => setShowTxModal(true)}
          className="w-14 h-14 bg-oldgold-500 hover:bg-oldgold-400 text-phthalo-900 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-transform active:scale-95 border border-oldgold-400"
        >
          <PlusCircle className="w-7 h-7" />
        </button>
      </div>

      {/* Archives Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-phthalo-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-phthalo-800 border border-oldgold-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl shadow-phthalo-950 max-h-[85vh] overflow-y-auto">
            
            {!selectedArchiveDate ? (
              // Calendar View
              <>
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-phthalo-800 z-10 pb-2 border-b border-phthalo-700">
                  <h2 className="text-xl font-bold text-oldgold-400 flex items-center gap-2">
                    <Archive className="w-5 h-5" />
                    Ledger Archives
                  </h2>
                  <button onClick={() => setShowArchiveModal(false)} className="text-phthalo-700 hover:text-oldgold-500 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="p-2 bg-phthalo-900/50 rounded-lg hover:bg-phthalo-700 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-oldgold-400" />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-200">
                    {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button onClick={nextMonth} className="p-2 bg-phthalo-900/50 rounded-lg hover:bg-phthalo-700 transition-colors">
                    <ChevronRight className="w-5 h-5 text-oldgold-400" />
                  </button>
                </div>
                
                {renderCalendarGrid()}
              </>
            ) : (
              // Specific Date Ledger View
              <>
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-phthalo-800 z-10 pb-2 border-b border-phthalo-700">
                  <button 
                    onClick={() => setSelectedArchiveDate(null)}
                    className="flex items-center gap-1 text-sm font-medium text-oldgold-500 hover:text-oldgold-400 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Calendar
                  </button>
                  <button onClick={() => setShowArchiveModal(false)} className="text-phthalo-700 hover:text-oldgold-500 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {renderDateGroup(selectedArchiveDate)}
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-phthalo-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-phthalo-800 border border-oldgold-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl shadow-phthalo-950">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-oldgold-400">Transmute Energy</h2>
              <button onClick={() => setShowTxModal(false)} className="text-phthalo-700 hover:text-oldgold-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddTx} className="flex flex-col gap-4">
              <div className="flex bg-phthalo-900/50 rounded-lg p-1 border border-phthalo-700/50">
                <button type="button" onClick={() => setTxType('expense')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${txType === 'expense' ? 'bg-phthalo-700 text-oldgold-400 shadow-sm' : 'text-gray-400 hover:text-oldgold-500/70'}`}>
                  Expenditure
                </button>
                <button type="button" onClick={() => setTxType('savings')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${txType === 'savings' ? 'bg-phthalo-700 text-blue-300 shadow-sm' : 'text-gray-400 hover:text-blue-300/70'}`}>
                  To Hoard
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-oldgold-500/60 uppercase tracking-widest mb-1.5">Intention</label>
                <input 
                  type="text" 
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder={txType === 'expense' ? "e.g., Bought clothes" : "e.g., Offering to the dragon familiars"}
                  className="w-full bg-phthalo-900/50 border border-phthalo-700 rounded-xl px-4 py-3 text-gray-100 placeholder-phthalo-700 focus:outline-none focus:border-oldgold-500 focus:ring-1 focus:ring-oldgold-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-oldgold-500/60 uppercase tracking-widest mb-1.5">Amount (LKR)</label>
                <input 
                  type="number" 
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  step="any"
                  className="w-full bg-phthalo-900/50 border border-phthalo-700 rounded-xl px-4 py-3 text-gray-100 placeholder-phthalo-700 focus:outline-none focus:border-oldgold-500 focus:ring-1 focus:ring-oldgold-500 transition-all"
                  required
                />
              </div>
              
              <button type="submit" className="w-full bg-oldgold-500 hover:bg-oldgold-400 text-phthalo-900 font-bold tracking-wide uppercase py-3.5 rounded-xl mt-4 transition-colors shadow-[0_0_15px_rgba(197,160,89,0.2)]">
                {txType === 'expense' ? 'Into the Flow of Abundance' : 'Offer to the Hoard'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-phthalo-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-phthalo-800 border border-oldgold-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-oldgold-400">
                <Settings2 className="w-5 h-5" />
                Cosmic Settings
              </h2>
              <button onClick={() => setShowSettingsModal(false)} className="text-phthalo-700 hover:text-oldgold-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-oldgold-500/60 uppercase tracking-widest mb-1.5">Exchange Rate</label>
                <input 
                  type="number" 
                  value={exchangeRate}
                  onChange={(e) => saveExchangeRate(Number(e.target.value))}
                  min="1"
                  className="w-full bg-phthalo-900/50 border border-phthalo-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-oldgold-500"
                />
              </div>
              <p className="text-xs text-phthalo-700">
                Updating this shifts the value of all past flows.
              </p>

              <div className="border-t border-phthalo-700/50 pt-4 mt-2">
                <label className="block text-xs font-medium text-oldgold-500/60 uppercase tracking-widest mb-3">Backup</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center gap-2 bg-phthalo-700 hover:bg-phthalo-600 text-gray-200 font-medium py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-phthalo-700 hover:bg-phthalo-600 text-gray-200 font-medium py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                  <input
                    type="file"
                    accept="application/json"
                    ref={fileInputRef}
                    onChange={handleImport}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-phthalo-700 mt-2">
                  Save your history as a file, or restore from one.
                </p>
              </div>

              <button onClick={() => setShowSettingsModal(false)} className="w-full bg-phthalo-700 hover:bg-phthalo-600 text-gray-200 font-bold py-3 rounded-xl mt-4 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;
