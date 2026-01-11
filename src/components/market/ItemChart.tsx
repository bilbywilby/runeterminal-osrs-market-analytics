import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from 'recharts';
import { TimeseriesPoint } from '@/lib/api';
import { format } from 'date-fns';
interface ItemChartProps {
    data: TimeseriesPoint[];
    isLoading?: boolean;
}
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-terminal-black border border-terminal-green p-2 font-mono text-[10px]">
                <p className="text-terminal-amber border-b border-terminal-green/20 mb-1 pb-1">
                    {format(new Date(label * 1000), 'MMM dd, HH:mm')}
                </p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name?.toUpperCase()}: {entry.value?.toLocaleString()} GP
                    </p>
                ))}
            </div>
        );
    }
    return null;
};
export function ItemChart({ data, isLoading }: ItemChartProps) {
    if (isLoading) {
        return <div className="w-full h-64 bg-terminal-green/5 border border-terminal-green/20 animate-pulse flex items-center justify-center font-mono text-xs">SYNCHRONIZING_TIMELINE...</div>;
    }
    if (!data || data.length === 0) {
        return <div className="w-full h-64 bg-terminal-green/5 border border-terminal-green/20 flex items-center justify-center font-mono text-xs">NO_TIMELINE_DATA_AVAILABLE</div>;
    }
    return (
        <div className="w-full h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#39ff14" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#39ff14" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffb000" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ffb000" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#39ff1410" vertical={false} />
                    <XAxis 
                        dataKey="timestamp" 
                        stroke="#39ff1450" 
                        fontSize={10}
                        tickFormatter={(unix) => format(new Date(unix * 1000), 'HH:mm')}
                        tick={{ fill: '#39ff1450' }}
                    />
                    <YAxis 
                        stroke="#39ff1450" 
                        fontSize={10} 
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                        tick={{ fill: '#39ff1450' }}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="avgHighPrice" 
                        name="Buy Price"
                        stroke="#39ff14" 
                        fillOpacity={1} 
                        fill="url(#colorHigh)" 
                    />
                    <Area 
                        type="monotone" 
                        dataKey="avgLowPrice" 
                        name="Sell Price"
                        stroke="#ffb000" 
                        fillOpacity={1} 
                        fill="url(#colorLow)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}