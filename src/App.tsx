/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  LayoutDashboard, 
  BrainCircuit, 
  Target, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  Settings,
  X,
  Key,
  Languages
} from 'lucide-react';
import { analyzeThought, generateDailyFocus, validateApiKey } from './services/geminiService';
import { getAllEntries, addEntry, deleteEntry as removeEntry, type Entry } from './services/thoughtService';

const TRANSLATIONS = {
  fr: {
    dashboard: "Tableau de bord",
    brainDump: "Vider son sac",
    dailyFocus: "Objectif du jour",
    recentInsights: "Analyses récentes",
    nextSteps: "Étapes suivantes :",
    settings: "Paramètres",
    history: "Historique",
    placeholder: "Qu'avez-vous en tête ? Projets, inquiétudes, idées...",
    capture: "Capturer la pensée",
    analyzing: "Analyse en cours...",
    emptyMind: "Libérez votre esprit. Lumina organisera le chaos.",
    sharedQuota: "Quota partagé",
    personalKey: "Clé personnelle active",
    apiKeyLabel: "Clé API Gemini Personnelle",
    apiKeyHelp: "Obtenez votre clé gratuite sur Google AI Studio. Votre clé est stockée localement.",
    whyKey: "Pourquoi ? La version gratuite de Lumina utilise un quota partagé. Utiliser votre propre clé garantit un service fluide.",
    saveClose: "Enregistrer et fermer",
    errorQuota: "Erreur de quota. Ajoutez votre propre clé API.",
    errorProcess: "Échec du traitement de la pensée. Vérifiez vos paramètres.",
    definingIntention: "Définition de votre intention...",
    engine: "Moteur de focus intelligent",
    validating: "Validation...",
    invalidKey: "Clé API invalide. Veuillez vérifier.",
    validKey: "Clé API valide !",
    testKey: "Tester la clé"
  },
  en: {
    dashboard: "Dashboard",
    brainDump: "Brain Dump",
    dailyFocus: "Daily Focus",
    recentInsights: "Recent Insights",
    nextSteps: "Next Steps:",
    settings: "Settings",
    history: "History",
    placeholder: "What's on your mind? Projects, worries, ideas...",
    capture: "Capture Thought",
    analyzing: "Analyzing...",
    emptyMind: "Empty your mind. Lumina will organize the chaos.",
    sharedQuota: "Shared Quota",
    personalKey: "Personal Key Active",
    apiKeyLabel: "Personal Gemini API Key",
    apiKeyHelp: "Get your free key on Google AI Studio. Your key is stored locally.",
    whyKey: "Why? Lumina's free version uses a shared quota. Using your own key ensures a smooth, personal service.",
    saveClose: "Save and Close",
    errorQuota: "Quota error. Add your own API key.",
    errorProcess: "Failed to process thought. Check your settings.",
    definingIntention: "Setting your intention...",
    engine: "Intelligent Focus Engine",
    validating: "Validating...",
    invalidKey: "Invalid API Key. Please check.",
    validKey: "Valid API Key!",
    testKey: "Test Key"
  }
};

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(() => getAllEntries());
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lang, setLang] = useState<'fr' | 'en'>(() => (localStorage.getItem('lumina_lang') as 'fr' | 'en') || 'fr');
  const [dailyFocus, setDailyFocus] = useState(TRANSLATIONS[lang].definingIntention);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'brain'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('lumina_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState(userApiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (entries.length > 0) {
      updateDailyFocus();
    }
  }, [entries, userApiKey, lang]);

  const toggleLang = () => {
    const newLang = lang === 'fr' ? 'en' : 'fr';
    setLang(newLang);
    localStorage.setItem('lumina_lang', newLang);
  };

  const handleTestKey = async () => {
    if (!tempApiKey.trim()) return;
    setIsValidating(true);
    setValidationStatus('idle');
    const isValid = await validateApiKey(tempApiKey);
    setIsValidating(false);
    setValidationStatus(isValid ? 'success' : 'error');
    if (isValid) {
      setUserApiKey(tempApiKey);
      localStorage.setItem('lumina_api_key', tempApiKey);
    }
  };

  const handleSaveAndClose = async () => {
    if (tempApiKey !== userApiKey) {
      await handleTestKey();
      if (validationStatus === 'error') return;
    }
    setShowSettings(false);
  };

  const refreshEntries = () => {
    setEntries(getAllEntries());
  };

  const updateDailyFocus = async () => {
    try {
      const context = entries.slice(0, 5).map(e => e.content).join('; ');
      const focus = await generateDailyFocus(context, userApiKey, lang);
      setDailyFocus(focus);
    } catch (error) {
      console.error('Focus error:', error);
      setDailyFocus(t.errorQuota);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsAnalyzing(true);
    try {
      const insight = await analyzeThought(input, userApiKey, lang);
      addEntry(input, 'thought', insight);
      setInput('');
      refreshEntries();
    } catch (error) {
      console.error('Échec du traitement de la pensée :', error);
      alert(t.errorProcess);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteEntry = (id: number) => {
    removeEntry(id);
    refreshEntries();
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <nav className="w-64 border-r border-black/5 p-6 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent font-bold text-xl">
            <Sparkles className="w-6 h-6" />
            <span>Lumina</span>
          </div>
          <button 
            onClick={toggleLang}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors text-ink/40 hover:text-accent"
            title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
          >
            <Languages className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-accent/10 text-accent font-medium' : 'text-ink/60 hover:bg-black/5'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {t.dashboard}
          </button>
          <button 
            onClick={() => setActiveTab('brain')}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeTab === 'brain' ? 'bg-accent/10 text-accent font-medium' : 'text-ink/60 hover:bg-black/5'}`}
          >
            <BrainCircuit className="w-4 h-4" />
            {t.brainDump}
          </button>
        </div>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-ink/60 hover:bg-black/5 transition-all"
          >
            <Settings className="w-4 h-4" />
            {t.settings}
          </button>
          <div className="p-4 rounded-2xl bg-black/5 text-xs text-ink/40">
            <p>Lumina v1.2</p>
            <p className="mt-1">{t.engine}</p>
            <p className="mt-2 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${userApiKey ? 'bg-accent' : 'bg-amber-400'}`}></span>
              {userApiKey ? t.personalKey : t.sharedQuota}
            </p>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-black/5"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent" />
                  {t.settings}
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-ink/40" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink/60 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      {t.apiKeyLabel}
                    </span>
                    {validationStatus !== 'idle' && (
                      <span className={`text-[10px] font-bold uppercase ${validationStatus === 'success' ? 'text-accent' : 'text-red-500'}`}>
                        {validationStatus === 'success' ? t.validKey : t.invalidKey}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input 
                      type="password"
                      value={tempApiKey}
                      onChange={(e) => {
                        setTempApiKey(e.target.value);
                        setValidationStatus('idle');
                      }}
                      placeholder="AIzaSy..."
                      className={`w-full p-4 pr-32 rounded-2xl bg-black/5 border outline-none transition-all font-mono text-sm ${
                        validationStatus === 'success' ? 'border-accent/30' : 
                        validationStatus === 'error' ? 'border-red-500/30' : 
                        'border-transparent focus:border-accent/20'
                      }`}
                    />
                    <button 
                      onClick={handleTestKey}
                      disabled={isValidating || !tempApiKey.trim()}
                      className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 disabled:opacity-50 transition-all"
                    >
                      {isValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t.testKey
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-ink/40 leading-relaxed">
                    {t.apiKeyHelp}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10">
                  <p className="text-xs text-accent/80 leading-relaxed">
                    {t.whyKey}
                  </p>
                </div>

                <button 
                  onClick={handleSaveAndClose}
                  className="w-full py-4 bg-accent text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/20"
                >
                  {t.saveClose}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-12 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Hero / Daily Focus */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/30">
                  <Target className="w-3 h-3" />
                  {t.dailyFocus}
                </div>
                <h1 className="text-5xl font-light tracking-tight leading-tight">
                  {dailyFocus}
                </h1>
              </section>

              {/* Recent Insights Grid */}
              <section className="space-y-6">
                <h2 className="text-xl font-medium">{t.recentInsights}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {entries.slice(0, 4).map((entry) => (
                    <motion.div 
                      layout
                      key={entry.id}
                      className="glass p-6 rounded-2xl card-shadow group relative"
                    >
                      <button 
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-ink/20 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          entry.metadata.priority === 'high' ? 'bg-red-100 text-red-600' : 
                          entry.metadata.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {entry.metadata.category}
                        </span>
                        <span className="text-[10px] text-ink/30 font-mono">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-ink/80 mb-4 line-clamp-2 italic">"{entry.content}"</p>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-ink/60">{t.nextSteps}</p>
                        {entry.metadata.nextSteps?.map((step, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-ink/50">
                            <ChevronRight className="w-3 h-3 mt-1 text-accent" />
                            {step}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="brain"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-light tracking-tight">{t.brainDump}</h1>
                <p className="text-ink/40">{t.emptyMind}</p>
              </div>

              <form onSubmit={handleSubmit} className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full h-48 p-8 rounded-3xl glass card-shadow focus:ring-2 focus:ring-accent/20 outline-none resize-none text-lg transition-all"
                />
                <button 
                  disabled={isAnalyzing || !input.trim()}
                  className="absolute bottom-6 right-6 bg-accent text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.analyzing}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t.capture}
                    </>
                  )}
                </button>
              </form>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink/30">{t.history}</h3>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-black/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <CheckCircle2 className="w-4 h-4 text-accent/40" />
                        <span className="text-ink/70 truncate max-w-md">{entry.content}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-ink/20">{new Date(entry.created_at).toLocaleTimeString()}</span>
                        <button 
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-ink/20 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
