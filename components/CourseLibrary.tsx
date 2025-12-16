import React, { useState } from 'react';
import { Course, Quiz, Question } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { PlayCircle, Plus, Wand2, Loader2, Link as LinkIcon, Clock, BrainCircuit, Search, Trash2, PlusCircle, CheckCircle, X, Eye } from 'lucide-react';
import { CoursePlayer } from './CoursePlayer';

interface CourseLibraryProps {
    courses: Course[];
    currentUserId: string;
    onCourseAdded: () => void;
}

export const CourseLibrary: React.FC<CourseLibraryProps> = ({ courses, currentUserId, onCourseAdded }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [playingCourse, setPlayingCourse] = useState<Course | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [desc, setDesc] = useState('');
    const [duration, setDuration] = useState(30);
    const [tags, setTags] = useState<string[]>([]);
    const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | undefined>(undefined);

    // Preview State
    const [showQuizPreview, setShowQuizPreview] = useState(false);

    const filteredCourses = courses.filter(course => {
        const term = searchTerm.toLowerCase();
        const titleMatch = course.title.toLowerCase().includes(term);
        const tagMatch = course.tags.some(tag => tag.toLowerCase().includes(term));
        return titleMatch || tagMatch;
    });

    const handleAutoGenerate = async () => {
        if (!url || !title) {
            alert("Please enter a Title and URL first.");
            return;
        }
        setIsLoadingAI(true);
        const result = await geminiService.generateCourseDetails(title, url);
        setDesc(result.description);
        setTags(result.tags);
        setGeneratedQuiz(result.quiz);
        setIsLoadingAI(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const newCourse: Course = {
            id: Date.now().toString(),
            title,
            description: desc,
            url,
            durationMinutes: duration,
            createdBy: currentUserId,
            tags,
            quiz: generatedQuiz
        };
        
        await storageService.addCourse(newCourse);
        onCourseAdded();
        setIsSaving(false);
        setIsModalOpen(false);
        
        // Reset form
        setTitle('');
        setUrl('');
        setDesc('');
        setTags([]);
        setGeneratedQuiz(undefined);
    };

    // --- Quiz Editing Handlers ---

    const handleAddQuestion = () => {
        const newQ: Question = {
            id: Date.now().toString() + Math.random(),
            text: '',
            options: ['', '', '', ''],
            correctAnswerIndex: 0
        };
        setGeneratedQuiz(prev => ({
            questions: [...(prev?.questions || []), newQ]
        }));
    };

    const handleUpdateQuestionText = (idx: number, text: string) => {
        if (!generatedQuiz) return;
        const questions = [...generatedQuiz.questions];
        questions[idx] = { ...questions[idx], text };
        setGeneratedQuiz({ ...generatedQuiz, questions });
    };

    const handleUpdateOption = (qIdx: number, oIdx: number, val: string) => {
        if (!generatedQuiz) return;
        const questions = [...generatedQuiz.questions];
        const options = [...questions[qIdx].options];
        options[oIdx] = val;
        questions[qIdx] = { ...questions[qIdx], options };
        setGeneratedQuiz({ ...generatedQuiz, questions });
    };

    const handleSetCorrectOption = (qIdx: number, oIdx: number) => {
        if (!generatedQuiz) return;
        const questions = [...generatedQuiz.questions];
        questions[qIdx] = { ...questions[qIdx], correctAnswerIndex: oIdx };
        setGeneratedQuiz({ ...generatedQuiz, questions });
    };

    const handleDeleteQuestion = (idx: number) => {
        if (!generatedQuiz) return;
        const questions = generatedQuiz.questions.filter((_, i) => i !== idx);
        setGeneratedQuiz({ ...generatedQuiz, questions });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">Course Library</h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon-purple transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by title or tag..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-neon-purple outline-none transition-all placeholder:text-slate-500"
                        />
                    </div>
                    
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-neon-purple hover:bg-violet-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold text-sm whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Add Course
                    </button>
                </div>
            </div>

            {filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl border-dashed">
                    <Search className="mx-auto text-slate-600 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
                    <p className="text-slate-400">Try adjusting your search terms or add a new course.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => (
                        <div key={course.id} className="group bg-slate-800 border border-slate-700 hover:border-neon-purple/50 rounded-xl overflow-hidden transition-all duration-300">
                            <div className="h-32 bg-slate-700 relative overflow-hidden">
                                {/* Abstract thumb */}
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle size={48} className="text-white/20 group-hover:text-neon-purple transition-colors" />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono flex items-center gap-1">
                                    <Clock size={12} /> {course.durationMinutes}m
                                </div>
                                {course.quiz && course.quiz.questions.length > 0 && (
                                    <div className="absolute top-2 left-2 bg-neon-green/90 text-black px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                        <BrainCircuit size={10} /> QUIZ INCLUDED
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{course.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 line-clamp-2 h-10">{course.description}</p>
                                
                                <div className="flex flex-wrap gap-2 mb-4 h-14 content-start overflow-hidden">
                                    {course.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-600">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                
                                <button 
                                    onClick={() => setPlayingCourse(course)}
                                    className="w-full text-center py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <PlayCircle size={16} />
                                    Start Learning
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Course Player Modal */}
            {playingCourse && (
                <CoursePlayer course={playingCourse} onClose={() => setPlayingCourse(null)} />
            )}

            {/* Add Course Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Create New Tutorial</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Title</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-neon-purple outline-none"
                                    placeholder="e.g. AWS S3 Mastery"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Video URL (S3 or YouTube)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="url" 
                                        required 
                                        className="flex-1 w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-neon-purple outline-none"
                                        placeholder="https://..."
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm text-slate-400">Description</label>
                                    <button 
                                        type="button" 
                                        onClick={handleAutoGenerate}
                                        disabled={isLoadingAI}
                                        className="text-xs text-neon-purple flex items-center gap-1 hover:text-white transition-colors"
                                    >
                                        {isLoadingAI ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />}
                                        Auto-fill with AI
                                    </button>
                                </div>
                                <textarea 
                                    required 
                                    rows={3}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:border-neon-purple outline-none"
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Duration (Minutes)</label>
                                <select 
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white"
                                    value={duration}
                                    onChange={e => setDuration(Number(e.target.value))}
                                >
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={60}>60 Minutes</option>
                                    <option value={90}>90 Minutes</option>
                                </select>
                            </div>

                            {/* Quiz Editor Section */}
                            <div className="border-t border-slate-700 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <BrainCircuit className="text-neon-purple" size={16} />
                                        Quiz Questions ({generatedQuiz?.questions.length || 0})
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {generatedQuiz && generatedQuiz.questions.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowQuizPreview(true)}
                                                className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg border border-slate-600 transition-colors"
                                            >
                                                <Eye size={14} /> Preview Quiz
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleAddQuestion}
                                            className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 transition-colors"
                                        >
                                            <PlusCircle size={14} /> Add Question
                                        </button>
                                    </div>
                                </div>

                                {generatedQuiz && generatedQuiz.questions.length > 0 ? (
                                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {generatedQuiz.questions.map((q, qIdx) => (
                                            <div key={q.id || qIdx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteQuestion(qIdx)}
                                                    className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                
                                                <div className="mb-3 pr-8">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter question text..."
                                                        className="w-full bg-transparent border-b border-slate-600 focus:border-neon-purple outline-none py-1 text-white font-medium placeholder:text-slate-600 text-sm"
                                                        value={q.text}
                                                        onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetCorrectOption(qIdx, oIdx)}
                                                                className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                                                    q.correctAnswerIndex === oIdx 
                                                                        ? 'border-green-500 bg-green-500 text-black' 
                                                                        : 'border-slate-600 hover:border-slate-400 text-transparent'
                                                                }`}
                                                                title="Mark as correct answer"
                                                            >
                                                                <CheckCircle size={12} fill="currentColor" />
                                                            </button>
                                                            <input
                                                                type="text"
                                                                placeholder={`Option ${oIdx + 1}`}
                                                                className={`flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:border-slate-500 outline-none ${q.correctAnswerIndex === oIdx ? 'text-green-400 border-green-900/50 bg-green-900/10' : ''}`}
                                                                value={opt}
                                                                onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border border-dashed border-slate-700 rounded-xl text-slate-500 text-sm">
                                        No questions yet. Add one manually or use AI auto-fill.
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-3 pt-4 border-t border-slate-700">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSaving}
                                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="flex-1 py-2 bg-neon-purple hover:bg-violet-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                                    {isSaving ? 'Creating...' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quiz Preview Modal */}
            {showQuizPreview && generatedQuiz && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <BrainCircuit className="text-neon-purple" />
                                Quiz Preview
                            </h3>
                            <button onClick={() => setShowQuizPreview(false)} className="text-slate-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {generatedQuiz.questions.map((q, i) => (
                                <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-medium text-white">
                                            <span className="text-neon-purple mr-2">{i+1}.</span>
                                            {q.text || "Untitled Question"}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => (
                                            <div key={optIdx} className={`p-3 rounded-lg border flex items-center justify-between ${
                                                optIdx === q.correctAnswerIndex 
                                                ? 'bg-green-500/10 border-green-500/50 text-green-100' 
                                                : 'bg-slate-900/50 border-slate-700 text-slate-400'
                                            }`}>
                                                <span>{opt || "Option " + (optIdx + 1)}</span>
                                                {optIdx === q.correctAnswerIndex && (
                                                    <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold">Correct Answer</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={() => setShowQuizPreview(false)} 
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}