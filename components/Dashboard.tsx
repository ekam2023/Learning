import React, { useMemo } from 'react';
import { User, Booking, WEEKLY_LIMIT_MINUTES } from '../types';
import { calculateWeeklyMinutes, calculateQuotaMinutes, getBookingsForUserThisWeek } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Clock, ShieldCheck, Zap, Trophy, Medal, TrendingUp } from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  allUsers: User[];
  bookings: Booking[];
  quote: string;
}

const COLORS = ['#10b981', '#334155']; // Green for used, Slate for remaining

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, allUsers, bookings, quote }) => {
  const weeklyUsage = useMemo(() => {
    const userBookings = getBookingsForUserThisWeek(bookings, currentUser.id, new Date());
    const quotaUsed = calculateQuotaMinutes(userBookings);
    const totalUsed = calculateWeeklyMinutes(userBookings);
    return { 
        quotaUsed, 
        totalUsed,
        remaining: Math.max(0, WEEKLY_LIMIT_MINUTES - quotaUsed) 
    };
  }, [bookings, currentUser]);

  const activityData = useMemo(() => {
      // Simple mock data for visual effect, ideally this comes from actual booking history
      return [
          { day: 'Mon', minutes: 15 },
          { day: 'Tue', minutes: 45 },
          { day: 'Wed', minutes: 30 },
          { day: 'Thu', minutes: 0 },
          { day: 'Fri', minutes: 0 },
      ];
  }, []);

  const leaderboard = useMemo(() => {
    const stats = new Map<string, number>();
    bookings.forEach(b => {
        const current = stats.get(b.userId) || 0;
        stats.set(b.userId, current + b.durationMinutes);
    });

    return Array.from(stats.entries())
        .map(([userId, minutes]) => ({
            user: allUsers.find(u => u.id === userId),
            minutes
        }))
        .filter(item => item.user)
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 5);
  }, [bookings, allUsers]);

  const data = [
    { name: 'Quota Used', value: weeklyUsage.quotaUsed },
    { name: 'Remaining', value: weeklyUsage.remaining },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 blur-3xl rounded-full pointer-events-none"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {currentUser.name}</h2>
        <p className="text-slate-400 italic">"{quote}"</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                    <Clock size={24} />
                </div>
                <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Queue Time</div>
                    <div className="text-xl font-bold text-white">{weeklyUsage.quotaUsed} / {WEEKLY_LIMIT_MINUTES} min</div>
                </div>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Learned</div>
                    <div className="text-xl font-bold text-white">{weeklyUsage.totalUsed} min</div>
                </div>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-neon-green/20 rounded-lg text-neon-green">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status</div>
                    <div className={`text-xl font-bold ${weeklyUsage.remaining === 0 ? 'text-yellow-500' : 'text-white'}`}>
                      {weeklyUsage.remaining === 0 ? 'Quota Full' : 'Active'}
                    </div>
                </div>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-neon-pink/20 rounded-lg text-neon-pink">
                    <Zap size={24} />
                </div>
                <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Next Slot</div>
                    <div className="text-xl font-bold text-white">Today 2pm</div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Quota */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">On-Queue Limit</h3>
          <div className="h-64 flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <div className="text-2xl font-bold text-white">{Math.round((weeklyUsage.quotaUsed / WEEKLY_LIMIT_MINUTES) * 100)}%</div>
                    <div className="text-xs text-slate-400">Used</div>
                </div>
             </div>
          </div>
        </div>

        {/* Chart 2: Velocity */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Trend</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                        <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="minutes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Chart 3: Leaderboard */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
             <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} />
                    Top Learners
                 </h3>
                 <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">All Time</span>
             </div>
             
             <div className="space-y-4">
                 {leaderboard.length === 0 ? (
                     <div className="text-center text-slate-500 py-10">No learning activity yet.</div>
                 ) : (
                     leaderboard.map((item, idx) => (
                         <div 
                            key={item.user!.id} 
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${item.user!.id === currentUser.id ? 'bg-neon-purple/10 border-neon-purple/50' : 'bg-slate-900/50 border-slate-700'}`}
                         >
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                 {idx <= 2 ? <Medal size={14} /> : idx + 1}
                             </div>
                             
                             <img src={item.user!.avatar} alt={item.user!.name} className="w-10 h-10 rounded-full border border-slate-600" />
                             
                             <div className="flex-1 min-w-0">
                                 <div className={`text-sm font-bold truncate ${item.user!.id === currentUser.id ? 'text-neon-purple' : 'text-white'}`}>
                                     {item.user!.name}
                                 </div>
                                 <div className="text-xs text-slate-400">{item.user!.role}</div>
                             </div>

                             <div className="text-right">
                                 <div className="text-sm font-bold text-white">{item.minutes}</div>
                                 <div className="text-[10px] text-slate-500 uppercase">Mins</div>
                             </div>
                         </div>
                     ))
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};