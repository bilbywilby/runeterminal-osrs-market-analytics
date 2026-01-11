import React, { useState } from 'react';
import { RetroLayout } from '@/components/layout/RetroLayout';
import { useMarketStore } from '@/store/marketStore';
import { computeRecs, parseCapital, FlipBuddyResponse } from '@/lib/flipBuddy';
import { Brain, Cpu, Terminal, Copy, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
export function FlipBuddy() {
  const items = useMarketStore(s => s.items);
  const prices = useMarketStore(s => s.prices);
  const prices5m = useMarketStore(s => s.prices5m);
  const volumes = useMarketStore(s => s.volumes24h);
  const [capital, setCapital] = useState('10M');
  const [risk, setRisk] = useState('moderate');
  const [horizon, setHorizon] = useState('2h');
  const [focus, setFocus] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processLog, setProcessLog] = useState<string[]>([]);
  const [result, setResult] = useState<FlipBuddyResponse | null>(null);
  const handleGenerate = async () => {
    setIsProcessing(true);
    setResult(null);
    setProcessLog([]);
    const logs = [
        "INITIALIZING_NEURAL_UPLINK...",
        "FETCHING_MARKET_SNAPSHOTS...",
        "ANALYZING_5M_LIQUIDITY_DYNAMICS...",
        "VERIFYING_24H_DATA_FRESHNESS...",
        "COMPUTING_QUANT_RANKINGS..."
    ];
    for (const log of logs) {
        setProcessLog(prev => [...prev, `> ${log}`]);
        await new Promise(r => setTimeout(r, 400));
    }
    try {
      const capNum = parseCapital(capital);
      if (capNum <= 0) {
        toast.error("INVALID_CAPITAL_INPUT");
        return;
      }
      const recs = computeRecs(capNum, risk, horizon, focus, items, prices, volumes, prices5m);
      if (!recs || !recs.items.length) {
        toast.error("ZERO_VECTORS_FOUND");
        setProcessLog(prev => [...prev, "> ERROR: NO_VIABLE_TARGETS"]);
      } else {
        setResult(recs);
        toast.success("STRATEGY_LOCKED");
      }
    } catch (err) {
      toast.error("ENGINE_FAULT_DETECTED");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };
  const copySequence = () => {
    if (!result) return;
    const text = result.items.map(i => `${i.name}: BUY @ ${i.buyPrice.toLocaleString()}gp`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success("SEQUENCE_LOCKED_TO_CLIPBOARD");
  };
  return (
    <RetroLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-terminal-green/30 pb-4">
          <h1 className="text-3xl font-black tracking-tighter uppercase glow-text flex items-center gap-3">
            <Brain className="text-terminal-amber" /> FLIP_BUDDY_ASSISTANT
          </h1>
          <p className="text-[10px] font-mono text-terminal-green/50 uppercase">UPLINK_SECURE // SYSTEM_STABLE // VERSION_2.1</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6 border border-terminal-green/20 p-6 bg-terminal-green/5">
            <h2 className="text-xs font-bold flex items-center gap-2 border-b border-terminal-green/10 pb-2 uppercase text-terminal-amber font-mono">
              <Cpu size={14} /> NEURAL_PARAMETERS
            </h2>
            <div className="space-y-4 font-mono">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-terminal-green/50">INPUT_CAPITAL</label>
                <Input
                  value={capital}
                  onChange={e => setCapital(e.target.value)}
                  placeholder="e.g. 50M"
                  className="bg-terminal-black border-terminal-green/30 rounded-none h-10 text-terminal-green focus:border-terminal-green uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-terminal-green/50">RISK_LEVEL</label>
                  <Select value={risk} onValueChange={setRisk}>
                    <SelectTrigger className="bg-terminal-black border-terminal-green/30 rounded-none h-10 text-terminal-green">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-terminal-black border-terminal-green border-2 rounded-none text-terminal-green">
                      <SelectItem value="low">STABLE</SelectItem>
                      <SelectItem value="moderate">MODERATE</SelectItem>
                      <SelectItem value="high">VOLATILE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-terminal-green/50">HORIZON</label>
                  <Select value={horizon} onValueChange={setHorizon}>
                    <SelectTrigger className="bg-terminal-black border-terminal-green/30 rounded-none h-10 text-terminal-green">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-terminal-black border-terminal-green border-2 rounded-none text-terminal-green">
                      <SelectItem value="2h">SCALP</SelectItem>
                      <SelectItem value="overnight">OVERNIGHT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="w-full bg-terminal-green text-terminal-black hover:bg-terminal-amber font-black rounded-none h-12 transition-all uppercase"
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                {isProcessing ? 'CALCULATING...' : 'COMPUTE_STRATEGY'}
              </Button>
            </div>
          </div>
          <div className="relative border border-terminal-green/20 bg-terminal-black p-6 font-mono text-[11px] min-h-[420px] shadow-[inset_0_0_20px_rgba(57,255,20,0.05)]">
            <div className="absolute top-2 right-2 flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-terminal-amber rounded-full animate-pulse delay-100" />
            </div>
            <h2 className="text-xs font-bold flex items-center gap-2 border-b border-terminal-green/10 pb-2 uppercase mb-4 text-terminal-green">
              <Terminal size={14} /> OUTPUT_BUFFER
            </h2>
            <div className="space-y-2">
                {processLog.map((log, i) => (
                    <div key={i} className="text-terminal-green/40">{log}</div>
                ))}
                {result && (
                  <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
                    <p className="text-terminal-amber leading-relaxed whitespace-pre-wrap">
                      <span className="text-terminal-green">"summary":</span> "{result.summary}",
                    </p>
                    <div className="pl-4 space-y-1.5">
                      <p className="text-terminal-green">"top_vectors": [</p>
                      {result.items.map((item, idx) => (
                        <div key={item.id} className="pl-4 leading-tight">
                          <span className="text-terminal-amber">"{item.name}"</span>
                          <span className="text-terminal-green">: {"{"}</span>
                          <span className="text-terminal-green/60"> profit: </span>
                          <span className="text-terminal-amber">+{item.profitPerItem.toLocaleString()}</span>
                          <span className="text-terminal-green"> {"}"}</span>
                          {idx < result.items.length - 1 ? ',' : ''}
                        </div>
                      ))}
                      <p className="text-terminal-green">],</p>
                      <p className="text-terminal-green">"wildcard": <span className="text-terminal-amber">"{result.wildcard.name}"</span></p>
                    </div>
                    <div className="pt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copySequence}
                        className="border-terminal-green/30 text-terminal-green hover:bg-terminal-green/10 rounded-none h-10 w-full text-[10px] uppercase font-bold"
                      >
                        <Copy size={12} className="mr-2" /> LOCK_SEQUENCE_TO_CLIPBOARD
                      </Button>
                    </div>
                  </div>
                )}
                {!isProcessing && !result && (
                  <div className="h-64 flex flex-col items-center justify-center opacity-20 text-center uppercase tracking-widest italic font-mono">
                    <div className="mb-2 animate-pulse">[ STANDBY ]</div>
                    AWAITING_INPUT_SIGNAL
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </RetroLayout>
  );
}