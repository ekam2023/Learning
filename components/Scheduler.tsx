import React, { useState, useMemo } from 'react';
import { User, Booking, Course, WEEKLY_LIMIT_MINUTES } from '../types';
import { generateDailySlots, formatTime, addMinutes, checkGlobalConflict, canUserBookMinutes, getBookingsForUserThisWeek, calculateQuotaMinutes, isWorkHours, doIntervalsOverlap, getWeekStart } from '../utils';
import { storageService } from '../services/storageService';
import { Calendar, ChevronLeft, ChevronRight, Lock, User as UserIcon, Trash2, AlertCircle, X, Moon, Sun, Clock, Filter, CheckCircle2, AlertTriangle, LayoutGrid, Columns, Loader2 } from 'lucide-react';

interface SchedulerProps {
    currentUser: User;
    allUsers: User[];
    courses: Course[];
    bookings: Booking[];
    onBookingChange: () => void;
}

export const Scheduler: React.FC<SchedulerProps> = ({ currentUser, allUsers, courses, bookings, onBookingChange }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    
    // Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [bookingCourseId, setBookingCourseId] = useState<string>('');
    const [bookingDuration, setBookingDuration] = useState(30);
    const [hideCompleted, setHideCompleted] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

    const daySlots = useMemo(() => generateDailySlots(), []);
    
    // Week/Day Navigation Logic
    const handlePrev = () => {
        const d = new Date(selectedDate);
        if (viewMode === 'day') d.setDate(d.getDate() - 1);
        else d.setDate(d.getDate() - 7);
        setSelectedDate(d);
    };

    const handleNext = () => {
        const d = new Date(selectedDate);
        if (viewMode === 'day') d.setDate(d.getDate() + 1);
        else d.setDate(d.getDate() + 7);
        setSelectedDate(d);
    };

    // Calculate dates to display
    const visibleDates = useMemo(() => {
        if (viewMode === 'day') return [selectedDate];
        
        const start = getWeekStart(selectedDate);
        const days = [];
        for (let i = 0; i < 5; i++) { 
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        const sat = new Date(start); sat.setDate(sat.getDate() + 5);
        const sun = new Date(start); sun.setDate(sun.getDate() + 6);
        days.push(sat, sun);
        
        return days;
    }, [selectedDate, viewMode]);

    // Helper to get names
    const getUserName = (id: string) => allUsers.find(u => u.id === id)?.name || 'Unknown';
    const getCourseTitle = (id: string) => courses.find(c => c.id === id)?.title || 'Unknown Course';

    // Filter Courses Logic
    const completedCourseIds = useMemo(() => {
        return new Set(bookings.filter(b => b.userId === currentUser.id).map(b => b.courseId));
    }, [bookings, currentUser.id]);

    const availableCourses = useMemo(() => {
        return courses.filter(c => !hideCompleted || !completedCourseIds.has(c.id));
    }, [courses, hideCompleted, completedCourseIds]);

    const handleSlotClick = (slotTime: Date) => {
        const targetStart = new Date(slotTime);
        const isTargetWorkHours = isWorkHours(targetStart);
        const minEnd = addMinutes(targetStart, 30);

        if (isTargetWorkHours) {
            const conflict = checkGlobalConflict(targetStart, minEnd, bookings);
            if (conflict) {
                const bookedBy = getUserName(conflict.userId);
                alert(`Coverage Conflict! ${bookedBy} is already learning at this time.`);
                return;
            }
        } else {
             const myConflict = bookings.find(b => 
                b.userId === currentUser.id && 
                doIntervalsOverlap(targetStart, minEnd, new Date(b.startTime), new Date(b.endTime))
             );
             if (myConflict) {
                 alert("You already have a session scheduled.");
                 return;
             }
        }

        setSelectedSlot(targetStart);
        const defaultCourseId = availableCourses[0]?.id || (courses[0]?.id || '');
        setBookingCourseId(defaultCourseId);
        const defaultCourse = courses.find(c => c.id === defaultCourseId);
        setBookingDuration(defaultCourse ? defaultCourse.durationMinutes : 30);
        setIsBookingModalOpen(true);
    };

    const getDurationStatus = (duration: number) => {
        if (!selectedSlot) return { valid: false, reason: '' };
        
        const targetEnd = addMinutes(selectedSlot, duration);
        const isTargetWorkHours = isWorkHours(selectedSlot);
        
        if (isTargetWorkHours) {
            const conflict = checkGlobalConflict(selectedSlot, targetEnd, bookings);
            if (conflict) {
                return { valid: false, reason: 'Team Busy' };
            }
        } 
        
        const myConflict = bookings.find(b => 
            b.userId === currentUser.id && 
            doIntervalsOverlap(selectedSlot, targetEnd, new Date(b.startTime), new Date(b.endTime))
        );
        if (myConflict) return { valid: false, reason: 'Overlap' };

        const userBookings = getBookingsForUserThisWeek(bookings, currentUser.id, selectedDate);
        if (!canUserBookMinutes(userBookings, duration, selectedSlot)) {
             return { valid: false, reason: 'Quota Full' };
        }

        return { valid: true, reason: '' };
    };

    const handleConfirmBooking = async () => {
        if (!selectedSlot) return;
        if (!bookingCourseId) {
            alert("Please select a course.");
            return;
        }

        const status = getDurationStatus(bookingDuration);
        if (!status.valid) {
            alert(`Cannot book: ${status.reason}`);
            return;
        }

        setIsProcessing(true);

        const targetEnd = addMinutes(selectedSlot, bookingDuration);
        
        const newBooking: Booking = {
            id: Date.now().toString(),
            userId: currentUser.id,
            courseId: bookingCourseId,
            startTime: selectedSlot.toISOString(),
            endTime: targetEnd.toISOString(),
            durationMinutes: bookingDuration
        };

        await storageService.addBooking(newBooking);
        onBookingChange();
        setIsProcessing(false);
        setIsBookingModalOpen(false);
    };

    const initiateDelete = (booking: Booking, e: React.MouseEvent) => {
        e.stopPropagation();
        setBookingToDelete(booking);
    };

    const confirmDelete = async () => {
        if (bookingToDelete) {
            setIsProcessing(true);
            await storageService.deleteBooking(bookingToDelete.id);
            onBookingChange();
            setIsProcessing(false);
            setBookingToDelete(null);
        }
    };

    const currentDurationStatus = selectedSlot ? getDurationStatus(bookingDuration) : { valid: false, reason: '' };

    return (
        <div className="space-y-6 pb-20 md:pb-0 relative animate-fade-in">
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrev} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300"><ChevronLeft /></button>
                    <div className="flex items-center gap-2 text-white font-bold text-lg">
                        <Calendar size={20} className="text-neon-purple"/>
                        {viewMode === 'day' ? selectedDate.toDateString() : `Week of ${visibleDates[0].toLocaleDateString()}`}
                    </div>
                    <button onClick={handleNext} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300"><ChevronRight /></button>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button 
                        onClick={() => setViewMode('day')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'day' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <LayoutGrid size={16} /> Day
                    </button>
                    <button 
                        onClick={() => setViewMode('week')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'week' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Columns size={16} /> Week
                    </button>
                </div>
             </div>

             {/* Grid View */}
             <div className={`
                ${viewMode === 'day' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex overflow-x-auto gap-4 pb-4 snap-x'}
             `}>
                {visibleDates.map((dateForCol, dayIndex) => {
                    const dayStart = new Date(dateForCol);
                    dayStart.setHours(0,0,0,0);
                    const dayEnd = new Date(dayStart);
                    dayEnd.setHours(23,59,59,999);
                    
                    // Filter bookings for this day column
                    const colBookings = bookings.filter(b => {
                        const t = new Date(b.startTime);
                        return t >= dayStart && t <= dayEnd;
                    });

                    return (
                        <div key={dayIndex} className={`${viewMode === 'week' ? 'min-w-[200px] w-[200px] flex-shrink-0 snap-start' : 'contents'}`}>
                            {viewMode === 'week' && (
                                <div className="text-center mb-3 sticky left-0">
                                    <div className="text-slate-400 text-xs font-bold uppercase">{dateForCol.toLocaleDateString(undefined, {weekday: 'short'})}</div>
                                    <div className="text-white font-bold text-lg">{dateForCol.getDate()}</div>
                                </div>
                            )}

                            {daySlots.map((slot, idx) => {
                                // Construct precise date for this slot
                                const slotStart = new Date(slot);
                                slotStart.setFullYear(dateForCol.getFullYear(), dateForCol.getMonth(), dateForCol.getDate());
                                const slotEnd = addMinutes(slotStart, 30); 
                                
                                const isSlotWorkHours = isWorkHours(slotStart);

                                // Check bookings for this specific slot
                                const myBooking = colBookings.find(b => 
                                    b.userId === currentUser.id && 
                                    doIntervalsOverlap(slotStart, slotEnd, new Date(b.startTime), new Date(b.endTime))
                                );

                                const otherBooking = colBookings.find(b => 
                                    b.userId !== currentUser.id && 
                                    doIntervalsOverlap(slotStart, slotEnd, new Date(b.startTime), new Date(b.endTime))
                                );
                                
                                let cardClass = "bg-slate-800/50 border-slate-700 hover:border-slate-500 cursor-pointer";
                                let statusIcon = isSlotWorkHours ? <Sun size={14} className="text-slate-500" /> : <Moon size={14} className="text-indigo-400" />;
                                let statusText = "Available";
                                
                                if (myBooking) {
                                    cardClass = "bg-neon-green/10 border-neon-green/50";
                                    statusText = "My Session";
                                } else if (otherBooking) {
                                    if (isSlotWorkHours) {
                                        cardClass = "bg-red-900/20 border-red-900/50 cursor-not-allowed opacity-75";
                                        statusIcon = <Lock size={14} className="text-red-400" />;
                                        statusText = `Blocked by ${getUserName(otherBooking.userId)}`;
                                    } else {
                                        cardClass = "bg-indigo-900/20 border-indigo-500/30 hover:border-indigo-500/60";
                                        statusText = `${getUserName(otherBooking.userId)} (Open)`;
                                        statusIcon = <UserIcon size={14} className="text-indigo-300" />;
                                    }
                                }

                                const content = (
                                    <div 
                                        onClick={() => {
                                            if (!myBooking && (!otherBooking || !isSlotWorkHours)) {
                                                handleSlotClick(slotStart);
                                            }
                                        }}
                                        className={`border rounded-lg p-3 transition-all duration-200 flex flex-col justify-between relative group
                                            ${cardClass}
                                            ${viewMode === 'week' ? 'h-20 mb-2 text-xs' : 'h-24 text-sm'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`font-mono font-bold text-white ${viewMode === 'week' ? 'text-sm' : 'text-xl'}`}>
                                                {formatTime(slotStart)}
                                            </span>
                                            {statusIcon}
                                        </div>
                                        
                                        {myBooking && (
                                            <button 
                                                onClick={(e) => initiateDelete(myBooking, e)}
                                                className="absolute top-1 right-1 p-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded transition-all z-10"
                                                title="Cancel"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}

                                        <div className="flex items-center gap-1 truncate">
                                            <span className={`truncate ${myBooking ? 'text-neon-green' : (otherBooking && isSlotWorkHours) ? 'text-red-400' : otherBooking ? 'text-indigo-300' : 'text-slate-400'}`}>
                                                {statusText}
                                            </span>
                                        </div>
                                    </div>
                                );

                                return viewMode === 'week' ? (
                                    <div key={idx}>{content}</div>
                                ) : (
                                    <div key={idx}>{content}</div>
                                );
                            })}
                        </div>
                    );
                })}
             </div>
             
             {/* Legend */}
             <div className="flex flex-col md:flex-row gap-4 mt-6">
                 <div className="flex-1 p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg text-blue-200 text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div>
                        <span className="font-bold">Work Hours (Mon-Fri, 9am-6pm):</span> Only one engineer allowed off-queue.
                    </div>
                 </div>
                 <div className="flex-1 p-4 bg-indigo-900/20 border border-indigo-900/50 rounded-lg text-indigo-200 text-sm flex items-start gap-2">
                    <Moon size={16} className="mt-0.5 shrink-0" />
                    <div>
                        <span className="font-bold">Off Hours:</span> Unlimited booking allowed.
                    </div>
                 </div>
             </div>

             {/* Booking Modal */}
             {isBookingModalOpen && selectedSlot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Clock className="text-neon-purple" />
                                Book Session
                            </h3>
                            <button onClick={() => setIsBookingModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Date</div>
                                    <div className="text-white font-medium">{selectedDate.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Time Slot</div>
                                    <div className="text-xl font-mono text-white flex items-center gap-2">
                                        <span>{formatTime(selectedSlot)}</span>
                                        <span className="text-slate-500">-</span>
                                        <span className={currentDurationStatus.valid ? "text-white" : "text-red-400"}>
                                            {formatTime(addMinutes(selectedSlot, bookingDuration))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* REFACTORED: Course Select First */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Select Course</label>
                                <select 
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-neon-purple outline-none transition-colors"
                                    value={bookingCourseId}
                                    onChange={(e) => {
                                        const newId = e.target.value;
                                        setBookingCourseId(newId);
                                        const selected = courses.find(c => c.id === newId);
                                        if (selected) {
                                            setBookingDuration(selected.durationMinutes);
                                        }
                                    }}
                                >
                                    {availableCourses.length === 0 ? (
                                        <option value="" disabled>No courses available</option>
                                    ) : (
                                        availableCourses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title} ({c.durationMinutes}m)</option>
                                        ))
                                    )}
                                </select>
                                
                                <div className="mt-2 flex items-center gap-2">
                                    <button 
                                        onClick={() => setHideCompleted(!hideCompleted)}
                                        className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${hideCompleted ? 'bg-neon-purple text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        <CheckCircle2 size={12} />
                                        {hideCompleted ? 'Hidden Completed' : 'Hide Completed'}
                                    </button>
                                </div>
                            </div>

                            {/* REFACTORED: Duration Second */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Duration</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[30, 45, 60].map(mins => {
                                        const status = getDurationStatus(mins);
                                        const isSelected = bookingDuration === mins;
                                        
                                        return (
                                            <button
                                                key={mins}
                                                disabled={!status.valid}
                                                onClick={() => setBookingDuration(mins)}
                                                className={`py-3 px-2 rounded-lg border text-sm font-bold transition-all relative flex flex-col items-center justify-center gap-1
                                                    ${isSelected && status.valid
                                                        ? 'bg-neon-purple border-neon-purple text-white shadow-lg shadow-neon-purple/20' 
                                                        : status.valid 
                                                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                                                            : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                                                    }
                                                `}
                                            >
                                                <span>{mins} min</span>
                                                {!status.valid && (
                                                    <span className="text-[9px] uppercase font-bold text-red-500 bg-red-950/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        {status.reason === 'Quota Full' ? <AlertCircle size={8}/> : <Lock size={8}/>}
                                                        {status.reason}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button 
                                onClick={handleConfirmBooking}
                                disabled={!currentDurationStatus.valid || isProcessing}
                                className={`w-full py-3.5 font-bold rounded-xl transition-all mt-2 flex items-center justify-center gap-2
                                    ${currentDurationStatus.valid 
                                        ? 'bg-white text-black hover:bg-slate-200' 
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                                `}
                            >
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : !currentDurationStatus.valid ? <AlertTriangle size={18} /> : null}
                                {isProcessing ? 'Booking...' : currentDurationStatus.valid ? 'Confirm Booking' : 'Unavailable'}
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {/* Delete Confirmation Modal */}
             {bookingToDelete && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                     <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                                <Trash2 size={24} />
                            </div>
                            <button 
                                onClick={() => setBookingToDelete(null)}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-2">Cancel Session?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Are you sure you want to cancel your session for <span className="text-white font-medium">{getCourseTitle(bookingToDelete.courseId)}</span>?
                        </p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setBookingToDelete(null)}
                                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700"
                            >
                                Keep It
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={isProcessing}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                            >
                                {isProcessing && <Loader2 size={16} className="animate-spin"/>}
                                Yes, Cancel
                            </button>
                        </div>
                     </div>
                 </div>
             )}
        </div>
    );
};