import React, { useState, useEffect } from 'react';
import { User, Course, Booking } from './types';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { CourseLibrary } from './components/CourseLibrary';
import { Scheduler } from './components/Scheduler';
import { AdminSettings } from './components/AdminSettings';
import { LayoutDashboard, Library, CalendarDays, LogOut, ChevronDown, Settings, Loader2 } from 'lucide-react';

type View = 'dashboard' | 'courses' | 'scheduler' | 'admin';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quote, setQuote] = useState<string>("Loading inspiration...");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
        setIsLoading(true);
        try {
            const [fetchedUsers, fetchedCourses, fetchedBookings] = await Promise.all([
                storageService.getUsers(),
                storageService.getCourses(),
                storageService.getBookings()
            ]);
            
            setUsers(fetchedUsers);
            setCourses(fetchedCourses);
            setBookings(fetchedBookings);
            
            if (fetchedUsers.length > 0) setCurrentUser(fetchedUsers[0]);
            
            // Load quote in background
            geminiService.getDailyQuote().then(setQuote);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };
    init();
  }, []);

  const refreshData = async () => {
    // Background refresh without blocking UI
    const [c, b] = await Promise.all([
        storageService.getCourses(),
        storageService.getBookings()
    ]);
    setCourses(c);
    setBookings(b);
  };

  if (isLoading || !currentUser) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
            <Loader2 size={48} className="animate-spin text-neon-purple" />
            <div className="text-xl font-bold">OpsLearn</div>
            <p className="text-slate-500">Connecting to secure storage...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-neon-purple selection:text-white pb-20 md:pb-0">
      {/* Navbar (Desktop) */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-neon-purple w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white">
                OL
              </div>
              <span className="font-bold text-xl tracking-tight text-white">Ops<span className="text-neon-purple">Learn</span></span>
            </div>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
               <button 
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-neon-purple' : 'text-slate-400 hover:text-white'}`}
               >
                 <LayoutDashboard size={18} /> Dashboard
               </button>
               <button 
                onClick={() => setView('courses')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'courses' ? 'text-neon-purple' : 'text-slate-400 hover:text-white'}`}
               >
                 <Library size={18} /> Courses
               </button>
               <button 
                onClick={() => setView('scheduler')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'scheduler' ? 'text-neon-purple' : 'text-slate-400 hover:text-white'}`}
               >
                 <CalendarDays size={18} /> Schedule
               </button>
               <button 
                onClick={() => setView('admin')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'admin' ? 'text-neon-purple' : 'text-slate-400 hover:text-white'}`}
               >
                 <Settings size={18} /> Admin
               </button>
            </div>

            <div className="relative">
                <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 hover:bg-slate-800 p-2 rounded-lg transition-colors"
                >
                    <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                    <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium text-white">{currentUser.name}</div>
                        <div className="text-xs text-slate-400">{currentUser.role}</div>
                    </div>
                    <ChevronDown size={14} className="text-slate-500" />
                </button>

                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                        <div className="p-2 border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider font-bold">Switch User</div>
                        {users.map(u => (
                            <button
                                key={u.id}
                                onClick={() => {
                                    setCurrentUser(u);
                                    setIsUserMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-800 ${u.id === currentUser.id ? 'text-neon-purple' : 'text-slate-300'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${u.id === currentUser.id ? 'bg-neon-purple' : 'bg-slate-600'}`}></div>
                                {u.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && (
            <Dashboard currentUser={currentUser} allUsers={users} bookings={bookings} quote={quote} />
        )}
        {view === 'courses' && (
            <CourseLibrary courses={courses} currentUserId={currentUser.id} onCourseAdded={refreshData} />
        )}
        {view === 'scheduler' && (
            <Scheduler 
                currentUser={currentUser} 
                allUsers={users}
                courses={courses} 
                bookings={bookings} 
                onBookingChange={refreshData} 
            />
        )}
        {view === 'admin' && (
            <AdminSettings />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-2 flex justify-around items-center z-40 safe-area-pb">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg ${view === 'dashboard' ? 'text-neon-purple' : 'text-slate-400'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => setView('courses')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg ${view === 'courses' ? 'text-neon-purple' : 'text-slate-400'}`}
        >
          <Library size={20} />
          <span className="text-[10px] font-medium">Courses</span>
        </button>
        <button 
          onClick={() => setView('scheduler')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg ${view === 'scheduler' ? 'text-neon-purple' : 'text-slate-400'}`}
        >
          <CalendarDays size={20} />
          <span className="text-[10px] font-medium">Schedule</span>
        </button>
        <button 
          onClick={() => setView('admin')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg ${view === 'admin' ? 'text-neon-purple' : 'text-slate-400'}`}
        >
          <Settings size={20} />
          <span className="text-[10px] font-medium">Admin</span>
        </button>
      </div>
    </div>
  );
};

export default App;