import { useState } from 'react';
import { useVoice, VOICE_REGIONS, VOICE_PRESETS, type VoicePresetId } from '../../context/VoiceContext';
import { Volume2, VolumeX, MapPin, Play, Sparkles, CheckCircle2, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceSettings() {
  const { 
    region, setRegion, isMuted, setIsMuted, speak, isSpeaking,
    voicePitch, voiceRate, voiceVolume,
    setVoicePitch, setVoiceRate, setVoiceVolume,
    activePreset, applyPreset, resetToDefaults,
    availableVoices, selectedVoiceName, setSelectedVoiceName
  } = useVoice();

  const [showCustomize, setShowCustomize] = useState(false);
  const [showVoiceList, setShowVoiceList] = useState(false);

  return (
    <div className="space-y-6">
      {/* Voice Toggle */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl transition-all ${isMuted ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'bg-gradient-to-br from-kirana-orange/20 to-amber-500/10 text-kirana-orange'}`}>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Voice Instructor</h4>
            <p className="text-[10px] text-slate-500 font-medium">
              {isMuted ? 'Awaaz band hai 😢' : 'Pyaari cute awaaz chalu hai 🎀✨'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isMuted 
              ? 'bg-slate-200 dark:bg-slate-700 focus:ring-slate-400' 
              : 'bg-gradient-to-r from-kirana-green to-emerald-500 focus:ring-kirana-green shadow-lg shadow-kirana-green/20'
          }`}
        >
          <span
            className={`${isMuted ? 'translate-x-1' : 'translate-x-6'} inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200`}
          />
        </button>
      </div>

      {/* Region Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 px-1">
          <MapPin size={12} className="text-kirana-orange" />
          Apni Region Chuniye / Select Dialect
        </label>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_REGIONS.map((r) => {
            const isActive = region === r.id;
            return (
              <motion.button
                key={r.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setRegion(r.id as any);
                  setTimeout(() => speak('WELCOME'), 200);
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${
                  isActive
                    ? 'border-kirana-green bg-kirana-green/5 dark:bg-kirana-green/10 shadow-md shadow-kirana-green/10'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{r.emoji}</span>
                  <span className={`text-xs font-bold block ${isActive ? 'text-kirana-green' : 'text-slate-600 dark:text-slate-300'}`}>
                    {r.label}
                  </span>
                </div>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-1.5 right-1.5"
                    >
                      <CheckCircle2 size={14} className="text-kirana-green fill-kirana-green/10" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ═══════════ VOICE CUSTOMIZATION SECTION ═══════════ */}
      <div className="space-y-3">
        <button
          onClick={() => setShowCustomize(!showCustomize)}
          className="w-full flex items-center justify-between bg-gradient-to-r from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 p-4 rounded-2xl border border-purple-500/15 hover:border-purple-500/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 text-purple-500">
              <SlidersHorizontal size={18} />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Customize Voice Tone</h4>
              <p className="text-[10px] text-slate-500 font-medium">
                Pitch, Speed, Volume — Apni marzi se adjust karein
              </p>
            </div>
          </div>
          {showCustomize ? <ChevronUp size={18} className="text-purple-400" /> : <ChevronDown size={18} className="text-purple-400" />}
        </button>

        <AnimatePresence>
          {showCustomize && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">

                {/* Presets */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={10} className="text-purple-400" />
                    Quick Presets — Jaldi Tone Choose Karein
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {VOICE_PRESETS.map((preset) => {
                      const isActive = activePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            applyPreset(preset.id as VoicePresetId);
                            setTimeout(() => speak('WELCOME'), 150);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                            isActive
                              ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md shadow-purple-500/10'
                              : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:border-purple-300 hover:text-purple-500'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                    {activePreset === 'custom' && (
                      <span className="px-3.5 py-2 rounded-xl text-xs font-bold border-2 border-amber-400 bg-amber-400/10 text-amber-600 dark:text-amber-400">
                        Custom 🎛️
                      </span>
                    )}
                  </div>
                </div>

                {/* Pitch Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      🎵 Pitch (Surr Upar Neeche)
                    </label>
                    <span className="text-[11px] font-black text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
                      {voicePitch.toFixed(2)}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.01"
                      value={voicePitch}
                      onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-blue-300 via-purple-400 to-pink-400 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-400 [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-400 [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 mt-1 px-0.5">
                      <span>Low / Deep</span>
                      <span>Default</span>
                      <span>High / Cute</span>
                    </div>
                  </div>
                </div>

                {/* Rate Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      🏃 Speed (Tez ya Dheere)
                    </label>
                    <span className="text-[11px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {voiceRate.toFixed(2)}x
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0.3"
                      max="2.0"
                      step="0.01"
                      value={voiceRate}
                      onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-400 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-400 [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-400 [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 mt-1 px-0.5">
                      <span>Bahut Dheere</span>
                      <span>Normal</span>
                      <span>Bahut Tez</span>
                    </div>
                  </div>
                </div>

                {/* Volume Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      🔊 Volume (Awaaz ka Level)
                    </label>
                    <span className="text-[11px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {Math.round(voiceVolume * 100)}%
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={voiceVolume}
                      onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-amber-200 via-orange-400 to-red-400 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-400 [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-amber-400 [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 mt-1 px-0.5">
                      <span>Mute</span>
                      <span>Medium</span>
                      <span>Full</span>
                    </div>
                  </div>
                </div>

                {/* Voice Selection Dropdown */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowVoiceList(!showVoiceList)}
                    className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Mic size={14} className="text-purple-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {selectedVoiceName 
                          ? `🎤 ${selectedVoiceName.length > 30 ? selectedVoiceName.slice(0, 30) + '...' : selectedVoiceName}` 
                          : '🤖 Auto — Best Voice Select Hogi'}
                      </span>
                    </div>
                    {showVoiceList ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>

                  <AnimatePresence>
                    {showVoiceList && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                          {/* Auto option */}
                          <button
                            onClick={() => { setSelectedVoiceName(''); setShowVoiceList(false); }}
                            className={`w-full text-left px-3 py-2.5 text-xs font-medium flex items-center justify-between transition-colors ${
                              !selectedVoiceName ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>🤖 Auto — Best Voice</span>
                            {!selectedVoiceName && <CheckCircle2 size={12} className="text-purple-500" />}
                          </button>

                          {/* Available voices */}
                          {availableVoices
                            .filter(v => !['male', 'david', 'mark', 'ravi'].some(k => v.name.toLowerCase().includes(k)))
                            .map((v) => {
                              const isSelected = selectedVoiceName === v.name;
                              const isNeural = ['online', 'neural', 'natural'].some(k => v.name.toLowerCase().includes(k));
                              return (
                                <button
                                  key={v.name}
                                  onClick={() => { setSelectedVoiceName(v.name); setShowVoiceList(false); setTimeout(() => speak('WELCOME'), 150); }}
                                  className={`w-full text-left px-3 py-2.5 text-xs font-medium flex items-center justify-between transition-colors ${
                                    isSelected ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="truncate">{v.name}</span>
                                    {isNeural && (
                                      <span className="shrink-0 text-[7px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                                        HD
                                      </span>
                                    )}
                                    <span className="shrink-0 text-[8px] text-slate-400">{v.lang}</span>
                                  </div>
                                  {isSelected && <CheckCircle2 size={12} className="text-purple-500 shrink-0" />}
                                </button>
                              );
                            })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Current Values Display */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                  <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Pitch</p>
                      <p className="text-sm font-black text-purple-500">{voicePitch.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Speed</p>
                      <p className="text-sm font-black text-emerald-500">{voiceRate.toFixed(2)}x</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Volume</p>
                      <p className="text-sm font-black text-amber-500">{Math.round(voiceVolume * 100)}%</p>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    resetToDefaults();
                    setTimeout(() => speak('WELCOME'), 200);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-400 hover:text-red-400 hover:border-red-300 transition-all"
                >
                  <RotateCcw size={14} />
                  Reset to Default — Wapas Original Tone
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Test Voice Button */}
      <button
        onClick={() => speak('WELCOME')}
        disabled={isMuted || isSpeaking}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all ${
          isMuted || isSpeaking
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-slate-800 to-slate-900 dark:from-kirana-green dark:to-emerald-600 text-white hover:opacity-90 active:scale-[0.98] shadow-xl shadow-slate-800/20 dark:shadow-kirana-green/20'
        }`}
      >
        {isSpeaking ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Bol rahi hoon...
          </>
        ) : (
          <>
            <Play size={16} fill="currentColor" />
            Awaaz Suniye — Test Voice
          </>
        )}
      </button>

      {/* Info Box */}
      <div className="p-3.5 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-xl border border-blue-500/10 flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-blue-500" />
        </div>
        <p className="text-[10px] leading-relaxed text-blue-600 dark:text-blue-400 font-medium">
          <strong>Tip:</strong> Awaaz automatically aapki selected region ke hisaab se badal jaati hai. Aur ab aap Customize mein jaake pitch, speed aur volume bhi apni marzi se adjust kar sakte hain! 🎛️✨
        </p>
      </div>
    </div>
  );
}
