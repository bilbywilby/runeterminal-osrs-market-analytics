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
  const volumes = useMarketStore(s => s.volumes24h);
  const [capital, setCapital] = useState('10M');
  const [risk, setRisk] = useState('moderate');
  const [horizon, setHorizon] = useState('2h');
  const [focus, setFocus] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FlipBuddyResponse | null>(null);
  const handleGenerate = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    try {
      const capNum = parseCapital(capital);
      if (capNum <= 0) {
        toast.error("INVALID_CAPITAL_INPUT");
        return;
      }
      const recs = computeRecs(capNum, risk, horizon, focus, items, prices, volumes);
      if (!recs || !recs.items.length) {
        toast.error("ZERO_VECTORS_FOUND_FOR_CAPITAL");
      } else {
        setResult(recs);
        toast.success("STRATEGY_COMPUTED");
      }
    } catch (err) {
      toast.error("ENGINE_FAULT_DETECTED");
    } finally {
      setIsProcessing(false);
    }
  };
  const copySequence = () => {
    if (!result) return;
    const text = result.items.map(i => i.name).join(', ');
    navigator.clipboard.writeText(text);
    toast.success("SEQUENCE_COPIED_TO_CLIPBOARD");
  };
  return (
    <RetroLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-terminal-green/30 pb-4">
          <h1 className="text-3xl font-black tracking-tighter uppercase glow-text flex items-center gap-3">
            <Brain className="text-terminal-amber" /> FLIP_BUDDY_ASSISTANT_V2
          </h1>
          <p className="text-[10px] font-mono text-terminal-green/50">NEURAL_NETWORK_STABLE // VERSION: 2.0.4-BETA</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6 border border-terminal-green/20 p-6 bg-terminal-green/5">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-terminal-green/10 pb-2 uppercase">
              <Cpu size={14} /> Neural_Parameters
            </h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-terminal-green/50">Working_Capital (e.g. 50M, 100K)</label>
                <Input
                  value={capital}
                  onChange={e => setCapital(e.target.value)}
                  className="bg-terminal-black border-terminal-green/30 rounded-none h-10 font-mono text-terminal-green"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-terminal-green/50">Risk_Profile</label>
                  <Select value={risk} onValueChange={setRisk}>
                    <SelectTrigger className="bg-terminal-black border-terminal-green/30 rounded-none h-10 font-mono text-terminal-green">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-terminal-black border-terminal-green border-2 rounded-none text-terminal-green">
                      <SelectItem value="low">LOW (STABLE)</SelectItem>
                      <SelectItem value="moderate">MODERATE</SelectItem>
                      <SelectItem value="high">HIGH (VOLATILE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-terminal-green/50">Time_Horizon</label>
                  <Select value={horizon} onValueChange={setHorizon}>
                    <SelectTrigger className="bg-terminal-black border-terminal-green/30 rounded-none h-10 font-mono text-terminal-green">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-terminal-black border-terminal-green border-2 rounded-none text-terminal-green">
                      <SelectItem value="2h">2H SCALPING</SelectItem>
                      <SelectItem value="overnight">OVERNIGHT</SelectItem>
                      <SelectItem value="week">1_WEEK_HOLD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-terminal-green/50">Market_Focus</label>
                <Select value={focus} onValueChange={setFocus}>
                  <SelectTrigger className="bg-terminal-black border-terminal-green/30 rounded-none h-10 font-mono text-terminal-green">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-terminal-black border-terminal-green border-2 rounded-none text-terminal-green">
                    <SelectItem value="all">ALL_MARKETS</SelectItem>
                    <SelectItem value="gear">PVM_GEAR_ONLY</SelectItem>
                    <SelectItem value="rares">HIGH_VALUE_RARES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="w-full bg-terminal-green text-terminal-black hover:bg-terminal-amber font-black rounded-none h-12 transition-colors uppercase"
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                {isProcessing ? 'CALCULATING_VECTORS...' : 'GENERATE_STRATEGY'}
              </Button>
            </div>
          </div>
          <div className="relative border border-terminal-green/20 bg-terminal-black p-6 font-mono text-xs overflow-hidden">
            <div className="absolute top-2 right-2 flex gap-2">
              <div className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-terminal-amber rounded-full animate-pulse delay-75" />
            </div>
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-terminal-green/10 pb-2 uppercase mb-4">
              <Terminal size={14} /> Output_Buffer
            </h2>
            {result ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-terminal-amber leading-relaxed whitespace-pre-wrap">
                  {`{ "summary": "${result.summary}", `}
                </p>
                <div className="pl-4 space-y-2">
                  <p className="text-terminal-green">{`"top_vectors": [`}</p>
                  {result.items.map((item, idx) => (
                    <div key={item.id} className="pl-4">
                      <span className="text-terminal-green/70">{`{ "id": ${item.id}, "asset": "${item.name}", "profit_est": "+${item.profitPerItem}gp", "note": "${item.shortNote}" }`}{idx < result.items.length - 1 ? ',' : ''}</span>
                    </div>
                  ))}
                  <p className="text-terminal-green">{`],`}</p>
                  <p className="text-terminal-amber">{`"wildcard": { "asset": "${result.wildcard.name}", "risk": "CRITICAL" }`}</p>
                </div>
                <p className="text-terminal-amber">{'}'}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copySequence}
                  className="mt-4 border-terminal-green/30 text-terminal-green rounded-none h-8 text-[10px] w-full"
                >
                  <Copy size={12} className="mr-2" /> COPY_SEQUENCE_FOR_CLIENT
                </Button>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center opacity-30 text-center uppercase">
                Awaiting_Parameters<br/>Initialize_Scan_To_Proceed
              </div>
            )}
          </div>
        </div>
      </div>
    </RetroLayout>
  );
}