import React, { useEffect, useRef, useState } from 'react';
import { Course } from '../types';
import { getYoutubeVideoId } from '../utils';
import { X, Trophy, ChevronRight, CheckCircle2, RotateCcw, AlertCircle, ExternalLink, BrainCircuit, Play, Check, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

interface CoursePlayerProps {
  course: Course;
  onClose: () => void;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, onClose }) => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [externalVideoOpened, setExternalVideoOpened] = useState(false);
  const [forceSafeMode, setForceSafeMode] = useState(false);
  
  // Quiz State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const youtubeId = getYoutubeVideoId(course.url);
  const playerRef = useRef<any>(null);

  // Helper: Determine valid origin for YouTube API
  const getOrigin = () => {
    if (typeof window === 'undefined') return '';
    try {
        const origin = window.location.origin;
        if (!origin || origin === 'null' || origin.startsWith('file:')) return '';
        // IMPORTANT: YouTube API requires origin to strictly match the domain.
        // If it ends with a slash, we remove it.
        return origin.endsWith('/') ? origin.slice(0, -1) : origin;
    } catch (e) {
        return '';
    }
  };
  
  const origin = getOrigin();
  // We can only use the JS API (for auto-complete) if we have a valid origin 
  // AND we haven't forced safe mode.
  const canUseJsApi = !!origin && !forceSafeMode;

  // Initialize YouTube Player events on the existing iframe
  useEffect(() => {
    if (!youtubeId || !canUseJsApi) return;

    // Handle Player State Changes
    const onPlayerStateChange = (event: any) => {
        if (event.data === 0) { // ENDED
            setVideoEnded(true);
            if (course.quiz && course.quiz.questions.length > 0) {
                setShowQuiz(true);
            }
        }
    };

    // Initialize the API functionality on the existing iframe
    const initPlayer = () => {
        const iframe = document.getElementById('course-player-iframe');
        if (window.YT && window.YT.Player && iframe) {
            try {
                if (playerRef.current) {
                    try { playerRef.current.destroy(); } catch(e) {}
                }

                playerRef.current = new window.YT.Player('course-player-iframe', {
                    events: {
                        'onStateChange': onPlayerStateChange,
                        // Capture API-level errors if possible
                        'onError': (e: any) => {
                            console.log("YouTube Player API Error:", e.data);
                            // Error 150/101/153 can technically be caught here if API inits
                            if (e.data === 150 || e.data === 101 || e.data === 153) {
                                setPlayerError(true);
                            }
                        }
                    }
                });
            } catch (e) {
                console.error("Failed to bind YouTube API to iframe", e);
            }
        }
    };

    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = initPlayer;
    } else {
        initPlayer();
    }
  }, [youtubeId, course.quiz, canUseJsApi]);

  // --- Quiz Handlers ---

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return; 
    setSelectedOption(index);
    
    const correctIdx = course.quiz!.questions[currentQuestionIdx].correctAnswerIndex;
    if (index === correctIdx) {
        setScore(score + 1);
    }

    setTimeout(() => {
        if (currentQuestionIdx < (course.quiz!.questions.length - 1)) {
            setCurrentQuestionIdx(currentQuestionIdx + 1);
            setSelectedOption(null);
        } else {
            setQuizCompleted(true);
        }
    }, 1500);
  };

  const retryQuiz = () => {
      setScore(0);
      setCurrentQuestionIdx(0);
      setQuizCompleted(false);
      setSelectedOption(null);
  };

  const handleManualCompletion = () => {
    setVideoEnded(true);
    if (course.quiz && course.quiz.questions.length > 0) {
        setShowQuiz(true);
    } else {
        onClose();
    }
  };

  const handleReloadSafeMode = () => {
      setPlayerError(false);
      setForceSafeMode(true);
  };

  // Construct the Embed URL
  const buildEmbedUrl = () => {
      if (!youtubeId) return '';
      
      const params = new URLSearchParams();
      // Core params
      params.append('rel', '0');
      params.append('autoplay', '1');
      params.append('playsinline', '1');
      params.append('modestbranding', '1');

      if (canUseJsApi) {
          // JS API configuration
          params.append('enablejsapi', '1');
          params.append('origin', origin);
          
          // CRITICAL: Adding widget_referrer matching origin helps satisfy strict-origin checks
          // This mimics the Referer header behavior for the widget validation logic on Google's side
          params.append('widget_referrer', origin);
      }
      
      return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
  };

  const embedUrl = buildEmbedUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
        >
            <X size={24} />
        </button>

        <div className="w-full max-w-6xl h-[85vh] flex flex-col md:flex-row bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Video Section */}
            <div className={`flex-1 relative bg-black transition-all duration-500 ${showQuiz ? 'md:w-1/2' : 'w-full'}`}>
                {!youtubeId ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                        <AlertCircle size={48} className="mb-4 text-slate-400" />
                        <h3 className="text-xl font-bold text-white mb-2">Video Format Not Supported</h3>
                        <p className="max-w-md mb-6">The provided URL could not be parsed.</p>
                        <a href={course.url} target="_blank" rel="noreferrer" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white flex items-center gap-2 transition-colors">
                            <ExternalLink size={18} /> Open Source Link
                        </a>
                     </div>
                ) : playerError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900 z-20">
                        {!externalVideoOpened ? (
                            <div className="flex flex-col items-center">
                                <AlertCircle size={48} className="text-red-400 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Playback Error</h3>
                                <p className="text-slate-400 mb-6 max-w-sm">
                                    YouTube restricted playback (Error 153).
                                </p>
                                <div className="flex flex-col gap-3 w-full max-w-xs">
                                    <button 
                                        onClick={handleReloadSafeMode}
                                        className="w-full py-3 bg-neon-purple hover:bg-violet-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={18} /> 
                                        Reload (Safe Mode)
                                    </button>
                                    <a 
                                        href={course.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        onClick={() => setExternalVideoOpened(true)}
                                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink size={18} /> 
                                        Watch Externally
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                                <h3 className="text-xl font-bold text-white mb-6">Finished watching?</h3>
                                <button
                                    onClick={handleManualCompletion}
                                    className="px-8 py-3 bg-neon-purple hover:bg-violet-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-neon-purple/20 flex items-center gap-2"
                                >
                                    <Check size={20} />
                                    {course.quiz && course.quiz.questions.length > 0 ? 'Yes, Take Quiz' : 'Yes, Complete'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <iframe
                            id="course-player-iframe"
                            title={course.title}
                            className="w-full h-full"
                            src={embedUrl}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            onError={() => setPlayerError(true)}
                        ></iframe>
                        
                        {/* Safe Mode Manual Completion Overlay */}
                        {forceSafeMode && !videoEnded && (
                            <div className="absolute top-4 right-4 z-10 animate-in fade-in">
                                <button
                                    onClick={handleManualCompletion}
                                    className="bg-neon-purple/90 hover:bg-neon-purple text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg backdrop-blur-md flex items-center gap-2"
                                >
                                    I'm Done Watching <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Quiz / Details Section */}
            {(showQuiz || (course.quiz && course.quiz.questions.length > 0)) && (
                <div className={`bg-slate-800 border-l border-slate-700 transition-all duration-500 flex flex-col ${showQuiz ? 'md:w-[400px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                    
                    {!quizCompleted ? (
                        <div className="p-6 h-full flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <BrainCircuit className="text-neon-purple" />
                                    Knowledge Check
                                </h3>
                                <div className="text-xs text-slate-400 mt-1">
                                    Question {currentQuestionIdx + 1} of {course.quiz!.questions.length}
                                </div>
                                <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-neon-purple transition-all duration-300"
                                        style={{ width: `${((currentQuestionIdx + 1) / course.quiz!.questions.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <h4 className="text-white font-medium mb-6 text-lg leading-relaxed">
                                    {course.quiz!.questions[currentQuestionIdx].text}
                                </h4>
                                
                                <div className="space-y-3">
                                    {course.quiz!.questions[currentQuestionIdx].options.map((opt, idx) => {
                                        const isSelected = selectedOption === idx;
                                        const isCorrect = idx === course.quiz!.questions[currentQuestionIdx].correctAnswerIndex;
                                        const showResult = selectedOption !== null;
                                        
                                        let btnClass = "border-slate-600 hover:border-slate-500 bg-slate-700/50 text-slate-200";
                                        if (showResult) {
                                            if (isCorrect) btnClass = "border-green-500 bg-green-500/20 text-white";
                                            else if (isSelected) btnClass = "border-red-500 bg-red-500/20 text-white";
                                            else btnClass = "border-slate-700 bg-slate-800/50 text-slate-500 opacity-50";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionSelect(idx)}
                                                disabled={showResult}
                                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group ${btnClass}`}
                                            >
                                                <span>{opt}</span>
                                                {showResult && isCorrect && <CheckCircle2 size={18} className="text-green-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6 text-yellow-400">
                                <Trophy size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h3>
                            <p className="text-slate-400 mb-6">You scored {score} out of {course.quiz!.questions.length}</p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={retryQuiz}
                                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={18} /> Retry
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-neon-purple hover:bg-violet-600 text-white rounded-xl font-bold transition-colors"
                                >
                                    Finish
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!showQuiz && course.quiz && course.quiz.questions.length > 0 && (
                 <button 
                    onClick={() => setShowQuiz(true)}
                    className="absolute bottom-8 right-8 bg-neon-purple hover:bg-violet-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-neon-purple/20 flex items-center gap-2 transition-transform hover:scale-105 z-10"
                >
                    Take Quiz Now <ChevronRight size={18} />
                </button>
            )}
        </div>
    </div>
  );
};