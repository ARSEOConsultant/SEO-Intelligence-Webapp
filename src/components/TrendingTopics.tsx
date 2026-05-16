import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Trend {
  topic: string;
  score: number;
  description: string;
}

interface TrendingTopicsProps {
  onSelectTrend: (trend: string) => void;
  activeTab: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0b0d] border border-[#24272e] p-3 rounded-sm shadow-2xl max-w-[220px] pointer-events-none relative z-50"
      >
        <p className="font-bold text-white text-[11px] uppercase tracking-widest mb-1">{data.topic}</p>
        <p className="text-[#c4a47c] text-[10px] mb-2 font-bold uppercase tracking-widest">Interest Score: {data.score}</p>
        <p className="text-gray-400 text-xs leading-relaxed">{data.description}</p>
      </motion.div>
    );
  }
  return null;
};

// sophisticated dark color palette gradient
const COLORS = [
  '#43382c',
  '#5d4e3d',
  '#78644f',
  '#927a60',
  '#ad8f71',
  '#c4a47c',
  '#d4b895'
];

export default function TrendingTopics({ onSelectTrend, activeTab }: TrendingTopicsProps) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch('/api/trends');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch trends');
        // Sort by score ascending for RadialBarChart (highest on outside)
        const sorted = (data.trends || []).sort((a: Trend, b: Trend) => a.score - b.score);
        setTrends(sorted);
      } catch (err: any) {
        console.error("Failed to fetch trends", err);
        setError(err.message || 'Failed to load trends.');
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="text-[10px] text-accent uppercase tracking-widest font-bold animate-pulse">Calculating Vectors...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-[10px] text-red-400 py-4 font-mono">{error}</div>;
  }

  if (!trends.length) {
    return <div className="text-xs text-gray-500 py-4">No trending data available.</div>;
  }

  const dataWithFill = trends.map((t, index) => {
    const isActive = activeTab === `Trend: ${t.topic}`;
    const isAnyActive = activeTab.startsWith('Trend: ');
    
    return {
      ...t,
      fill: isActive ? '#ffffff' : (isAnyActive ? '#2c313a' : COLORS[index % COLORS.length]),
      isActive
    };
  });

  // Reverse for legend so highest score is at the top
  const legendData = [...dataWithFill].reverse();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full mt-4 flex flex-col gap-6"
    >
      <div className="h-[220px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="25%" 
            outerRadius="100%" 
            barSize={12} 
            data={dataWithFill}
            startAngle={180}
            endAngle={-180}
          >
            <RadialBar
              background={{ fill: '#1a1d23' }}
              dataKey="score"
              cornerRadius={10}
              className="cursor-pointer hover:brightness-125 transition-all outline-none"
              onClick={(data: any) => onSelectTrend(data?.payload?.topic || data?.topic)}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }} 
              content={<CustomTooltip />} 
              isAnimationActive={false} // Prevents stuttering in some browsers
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none flex flex-col items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping absolute"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent relative"></span>
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-accent opacity-60 mt-1">Pulse</span>
        </div>
      </div>
      
      <ul className="flex flex-col gap-2 w-full pr-1">
        {legendData.map((entry, index) => (
          <motion.li 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            key={`item-${index}`} 
            className={`text-xs cursor-pointer flex items-center justify-between gap-3 transition-all hover:text-white px-2 py-2 rounded-sm outline-none w-full ${
              entry.isActive 
                ? 'bg-accent/10 text-white font-bold border border-accent/50 shadow-inner' 
                : 'bg-transparent text-gray-400 border border-transparent hover:bg-bg-primary'
            }`}
            onClick={() => onSelectTrend(entry.topic)}
          >
            <div className="flex items-center gap-3 overflow-hidden">
               <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm transition-colors" style={{ backgroundColor: entry.fill, boxShadow: entry.isActive ? '0 0 8px rgba(255,255,255,0.8)' : 'none' }}></span>
               <span className="truncate tracking-wide">{entry.topic}</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 transition-colors ${entry.isActive ? 'bg-accent text-bg-primary border-accent font-bold' : 'text-text-muted bg-bg-primary border-border-dark'}`}>{entry.score}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
