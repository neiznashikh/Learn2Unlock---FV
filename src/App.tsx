// Triggering full repository sync after accidental deletion
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Lock, Settings, User, Baby, Brain, CheckCircle2, XCircle, ChevronRight, LogOut, Mic, Volume2, AlertCircle, RefreshCcw, X, Layers, Smartphone, ShieldCheck
} from 'lucide-react';
import { AppView, ChildProfile, Task, TaskType } from './types';
import { generateTask, evaluateAudio, evaluateTextAnswer, generateSpeech } from './services/geminiService';

const LOGO_URL = "/logo.png";

// --- Components ---

const PinScreen = ({ onUnlock, correctPin }: { onUnlock: () => void, correctPin: string }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePin = (val: string) => {
    if (pin.length < 6) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 6) {
        if (newPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%)] from-indigo-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-10 text-center border border-white/50 backdrop-blur-sm"
      >
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 p-3 overflow-hidden shadow-xl shadow-indigo-100 border border-slate-100/50">
          <img src={LOGO_URL} alt="Learn2Unlock" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-3xl font-display font-black text-indigo-950 mb-2">Learn2Unlock</h1>
        <p className="text-slate-500 mb-10 font-medium">Enter 6-digit PIN to access settings</p>
        
        <div className="flex justify-center gap-4 mb-12">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div 
              key={i}
              animate={pin.length > i ? { scale: [1, 1.2, 1] } : {}}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                pin.length > i ? 'bg-indigo-600 border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'border-slate-200'
              } ${error ? 'bg-red-500 border-red-500 animate-shake' : ''}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'C'].map((btn, i) => (
            <button
              key={i}
              onClick={() => {
                if (btn === 'C') setPin('');
                else if (btn !== '') handlePin(btn.toString());
              }}
              className={`h-20 rounded-[1.5rem] text-2xl font-display font-bold transition-all active:scale-90 ${
                btn === '' ? 'invisible' : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const ParentSettingsScreen = ({ profile, onSave, onBack, onManageApps }: { profile: ChildProfile, onSave: (p: ChildProfile) => void, onBack: () => void, onManageApps: () => void }) => {
  const [formData, setFormData] = useState<ChildProfile>(profile);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm border border-slate-100">
              <img src={LOGO_URL} alt="L2U" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-slate-900 leading-none mb-1">Settings</h1>
              <p className="text-slate-400 text-sm font-medium">Parental Control Panel</p>
            </div>
          </div>
          <button onClick={onBack} className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all active:scale-95 group">
            <LogOut className="w-6 h-6 text-slate-500 group-hover:text-indigo-600" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Stats Dashboard */}
          {profile.history && profile.history.length > 0 && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-display font-black mb-6 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Progress Report
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Solved</p>
                  <p className="text-3xl font-display font-black text-indigo-600">
                    {profile.history.reduce((acc, curr) => acc + curr.tasksSolved, 0)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Accuracy</p>
                  <p className="text-3xl font-display font-black text-indigo-600">
                    {Math.round((profile.history.reduce((acc, curr) => acc + (curr.successRate || 1), 0) / profile.history.length) * 100)}%
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Level</p>
                  <p className="text-3xl font-display font-black text-indigo-600">{profile.skills?.[profile.preferredTaskType] || 1}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sessions</p>
                  <p className="text-3xl font-display font-black text-indigo-600">{profile.history.length}</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <p className="text-sm font-bold text-slate-500 mb-4">Task Resolution History</p>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profile.history.map(h => ({ ...h, date: new Date(h.date).toLocaleDateString() }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="tasksSolved" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Child's Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Artem"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">School Grade</label>
              <select 
                value={formData.grade}
                onChange={e => setFormData({...formData, grade: parseInt(e.target.value) || 1})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                {[1,2,3,4,5,6,7,8,9,10,11].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Task Language</label>
              <input 
                type="text" 
                value={formData.language}
                onChange={e => setFormData({...formData, language: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. English, Kazakh, Russian..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Task Category</label>
              <select 
                value={formData.preferredTaskType}
                onChange={e => setFormData({...formData, preferredTaskType: e.target.value as TaskType})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="SCHOOL_MATH">School Math</option>
                <option value="LOGIC">Logic Puzzles</option>
                <option value="READING">Reading Aloud</option>
                <option value="RETELLING">Retelling Text</option>
                <option value="SCIENCE">Science & Nature</option>
                <option value="LANGUAGES">Foreign Languages</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Tasks to Unlock</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={formData.taskCount}
                onChange={e => setFormData({...formData, taskCount: parseInt(e.target.value)})}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-2xl font-black text-blue-600 w-12 text-center">{formData.taskCount}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">The child will need to solve this many tasks in a row to unlock the phone.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Parent PIN (6 digits)</label>
            <input 
              type="text" 
              maxLength={6}
              value={formData.parentPin}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 6) setFormData({...formData, parentPin: val});
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-lg tracking-widest"
              placeholder="123456"
            />
            <p className="text-xs text-slate-400 mt-2">This PIN is required to access these settings and unlock the phone manually.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Interests (comma separated)</label>
            <textarea 
              value={formData.interests}
              onChange={e => setFormData({...formData, interests: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-32"
              placeholder="Minecraft, space, dinosaurs, robots..."
            />
          </div>

          <AnimatePresence>
            {localError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 font-bold"
              >
                <AlertCircle className="w-6 h-6 shrink-0" />
                {localError}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={onManageApps}
            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all mb-4 flex items-center justify-center gap-3"
          >
            <Layers className="w-6 h-6" />
            Manage Blocked Apps
          </button>

          <button 
            onClick={() => {
              if (formData.name.length < 2) {
                setLocalError(formData.language.toLowerCase().includes('ru') ? "Введите имя ребенка" : "Please enter child's name");
                return;
              }
              if (formData.parentPin.length !== 6) {
                setLocalError(formData.language.toLowerCase().includes('ru') ? "PIN-код должен состоять из 6 цифр" : "PIN must be exactly 6 digits");
                return;
              }
              setLocalError(null);
              onSave(formData);
            }}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            Save and Lock
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

const ChildScreen = ({ profile, onStartTask, onParentMode }: { profile: ChildProfile, onStartTask: () => void, onParentMode: () => void }) => {
  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center z-10"
      >
        <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl p-4 overflow-hidden">
          <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tight drop-shadow-md">Hi, {profile.name}! 👋</h1>
        <p className="text-xl text-white/80 mb-12 max-w-xs mx-auto">To unlock the phone, you need to solve a few tasks!</p>
        
        <button 
          onClick={onStartTask}
          className="group relative bg-white text-indigo-600 px-10 py-5 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-4 mx-auto"
        >
          <Brain className="w-8 h-8 group-hover:rotate-12 transition-transform" />
          SOLVE TASK
          <ChevronRight className="w-6 h-6" />
        </button>
      </motion.div>

      <button 
        onClick={onParentMode}
        className="absolute bottom-8 right-8 p-4 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all"
      >
        <Settings className="w-6 h-6" />
      </button>
    </div>
  );
};

const TaskScreen = ({ profile, onComplete, onParentMode }: { profile: ChildProfile, onComplete: () => void, onParentMode: () => void }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [solvedCount, setSolvedCount] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const loadTask = async () => {
    setLoading(true);
    setAiError(null);
    setFeedback(null);
    setAudioBlob(null);
    const result = await generateTask(profile);
    setTask(result.task);
    if (result.error) setAiError(result.error);
    setLoading(false);
    setAnswer('');
    setStatus('idle');
  };

  useEffect(() => {
    loadTask();
  }, [profile]);

  const startRecording = async () => {
    try {
      setAudioBlob(null);
      setFeedback(null);
      setAiError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        if (blob.size > 0) {
          setAudioBlob(blob);
        } else {
          setAiError("Audio was too short. Try again.");
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error", err);
      setAiError("Microphone access is required!");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
      }
      setMediaRecorder(null);
    }
  };

  const handleSpeak = async () => {
    if (!task) return;
    const text = task.type === 'READING' ? task.text : (task.type === 'RETELLING' ? task.story : '');
    if (!text) return;

    setIsSpeaking(true);
    const audioData = await generateSpeech(text);
    if (audioData) {
      const audio = new Audio('data:audio/wav;base64,' + audioData);
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } else {
      // Browser fallback
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = profile.language.toLowerCase().includes('ru') ? 'ru-RU' : 'en-US';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAudioSubmit = async () => {
    if (!audioBlob || !task) return;
    setEvaluating(true);
    setFeedback(null);
    setAiError(null);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;
      
      const evaluation = await evaluateAudio(base64Audio, task, profile);
      
      setEvaluating(false);
      setFeedback(evaluation.feedback);
      
      if (evaluation.success) {
        setStatus('correct');
        const nextCount = solvedCount + 1;
        setSolvedCount(nextCount);
        setTimeout(() => {
          if (nextCount >= profile.taskCount) onComplete();
          else loadTask();
        }, 2000);
      } else {
        setStatus('wrong');
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch (err: any) {
      console.error("Audio conversion/evaluation failed", err);
      setAiError("Evaluation failed. Please try again or retake.");
      setEvaluating(false);
    }
  };

  const checkAnswer = async () => {
    if (!task || (task.type !== 'SCHOOL_MATH' && task.type !== 'LOGIC')) return;
    
    setEvaluating(true);
    const evaluation = await evaluateTextAnswer(answer, task, profile);
    setEvaluating(false);
    setFeedback(evaluation.feedback);

    if (evaluation.success) {
      setStatus('correct');
      const nextCount = solvedCount + 1;
      setSolvedCount(nextCount);
      
      setTimeout(() => {
        if (nextCount >= profile.taskCount) {
          onComplete();
        } else {
          loadTask();
        }
      }, 1500);
    } else {
      setStatus('wrong');
      setTimeout(() => {
        setStatus('idle');
        setAnswer('');
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white">
        <motion.div 
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mb-8 w-24 h-24 bg-white rounded-3xl p-4 shadow-2xl overflow-hidden"
        >
          <img src={LOGO_URL} alt="Loading" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </motion.div>
        <h2 className="text-2xl font-black animate-pulse tracking-tight">
          {solvedCount > 0 ? `Good job! Next task...` : 'Preparing your task...'}
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center p-6 text-white relative overflow-y-auto pt-24">
      <div className="fixed top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="flex gap-2">
          {Array.from({ length: profile.taskCount }).map((_, i) => (
            <div 
              key={i} 
              className={`h-2 w-8 rounded-full transition-all duration-500 ${
                i < solvedCount ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 
                i === solvedCount ? 'bg-white animate-pulse' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
        <span className="font-black text-xl opacity-50">{solvedCount + 1} / {profile.taskCount}</span>
      </div>

      <motion.div 
        key={solvedCount}
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 text-slate-800 shadow-2xl"
      >
        {aiError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{aiError}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            {task?.type === 'SCHOOL_MATH' || task?.type === 'LOGIC' ? <Brain className="w-6 h-6 text-indigo-600" /> : 
             task?.type === 'READING' ? <Volume2 className="w-6 h-6 text-indigo-600" /> : 
             <Mic className="w-6 h-6 text-indigo-600" />}
          </div>
          <span className="font-bold text-indigo-600 uppercase tracking-wider text-sm">
            {task?.type === 'SCHOOL_MATH' ? 'School Math' : 
             task?.type === 'LOGIC' ? 'Logic Puzzle' :
             task?.type === 'SCIENCE' ? 'Science & Nature' :
             task?.type === 'LANGUAGES' ? 'Languages' :
             task?.type === 'READING' ? 'Reading Aloud' : 'Retelling'}
          </span>
        </div>

        <div className="mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {(task?.type === 'SCHOOL_MATH' || task?.type === 'LOGIC' || task?.type === 'SCIENCE' || task?.type === 'LANGUAGES') && (
            <p className="text-2xl font-bold leading-tight text-slate-700">{task.question}</p>
          )}
          {task?.type === 'READING' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-indigo-400 font-black uppercase tracking-widest">Read this text:</p>
                <button 
                  onClick={handleSpeak}
                  disabled={isSpeaking}
                  className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  {isSpeaking ? 'Listening...' : 'Hear it'}
                </button>
              </div>
              <p className="text-xl font-bold leading-relaxed bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 text-slate-800">{task.text}</p>
            </div>
          )}
          {task?.type === 'RETELLING' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-indigo-400 font-black uppercase tracking-widest">Listen/Read and retell:</p>
                <button 
                  onClick={handleSpeak}
                  disabled={isSpeaking}
                  className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  {isSpeaking ? 'Listening...' : 'Read it to me'}
                </button>
              </div>
              <p className="text-xl font-bold leading-relaxed bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 text-slate-800">{task.story}</p>
            </div>
          )}
        </div>

        {(task?.type === 'SCHOOL_MATH' || task?.type === 'LOGIC' || task?.type === 'SCIENCE' || task?.type === 'LANGUAGES') && (
          <div className="space-y-4 mb-6">
            <div className="relative">
              <input 
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkAnswer()}
                className={`w-full bg-slate-100 border-2 rounded-2xl px-6 py-5 text-3xl font-black text-center outline-none transition-all ${
                  status === 'correct' ? 'border-green-500 bg-green-50 text-green-600' : 
                  status === 'wrong' ? 'border-red-500 bg-red-50 text-red-600 animate-shake' : 
                  'border-transparent focus:border-indigo-500'
                }`}
                placeholder="?"
                autoFocus
              />
              <AnimatePresence>
                {status === 'correct' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </motion.div>
                )}
                {status === 'wrong' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border text-sm font-medium ${
                  status === 'correct' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                }`}
              >
                {feedback}
              </motion.div>
            )}
          </div>
        )}

        {(task?.type === 'READING' || task?.type === 'RETELLING') && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              {isRecording && !audioBlob && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <div className="flex gap-1 items-center h-4">
                    {[1,2,3,4,5].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ height: [4, 16, 4] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                        className="w-1 bg-red-500 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-red-500 font-black text-xs uppercase tracking-tighter">Recording...</span>
                </motion.div>
              )}
              
              {!audioBlob ? (
                <button 
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  onTouchCancel={stopRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all relative ${
                    isRecording ? 'bg-red-500 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.6)]' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                  }`}
                >
                  {isRecording && (
                    <motion.div 
                      layoutId="ring"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute inset-0 rounded-full bg-red-500"
                    />
                  )}
                  <Mic className={`w-10 h-10 z-10 ${isRecording ? 'text-white' : ''}`} />
                </button>
              ) : (
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setAudioBlob(null)}
                    disabled={evaluating}
                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCcw className="w-5 h-5" /> Retake
                  </button>
                  <button 
                    onClick={handleAudioSubmit}
                    disabled={evaluating}
                    className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {evaluating ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <RefreshCcw className="w-5 h-5" />
                        </motion.div>
                        Checking...
                      </>
                    ) : 'Check Answer'}
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-500 font-bold">
                {isRecording ? 'Release to finish' : !audioBlob ? 'Hold to speak' : 'Ready!'}
              </p>
            </div>

            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border text-sm font-medium ${
                  status === 'correct' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                }`}
              >
                {feedback}
              </motion.div>
            )}
          </div>
        )}

        {(task?.type === 'SCHOOL_MATH' || task?.type === 'LOGIC' || task?.type === 'SCIENCE' || task?.type === 'LANGUAGES') && (
          <div className="flex gap-4">
            <button 
              onClick={loadTask}
              className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" /> Skip
            </button>
            <button 
              onClick={checkAnswer}
              disabled={status === 'correct' || evaluating}
              className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] disabled:opacity-50"
            >
              {evaluating ? 'Checking...' : 'SUBMIT'}
            </button>
          </div>
        )}
      </motion.div>

      <button 
        onClick={onParentMode}
        className="absolute bottom-8 right-8 p-4 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all text-white"
      >
        <Settings className="w-6 h-6" />
      </button>
    </div>
  );
};

const SuccessScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    // Если мы в приложении через Native Bridge, разблокируем текущее приложение
    if ((window as any).Android) {
      (window as any).Android.unlockCurrentApp();
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-6 text-white text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10, stiffness: 100 }}
      >
        <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl p-4 overflow-hidden">
          <CheckCircle2 className="w-full h-full text-green-500" />
        </div>
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-5xl font-display font-black mb-4 tracking-tight"
      >
        SUPER WORK! 🏆
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-white/80 mb-12 max-w-xs mx-auto"
      >
        You have solved all tasks. The phone is now unlocked! Enjoy!
      </motion.p>
      
      <motion.button 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={onFinish}
        className="bg-white text-green-600 px-12 py-5 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 transition-all active:scale-95"
      >
        GO! 🚀
      </motion.button>
    </div>
  );
};

const AppManagementScreen = ({ onBack }: { onBack: () => void }) => {
  const [apps, setApps] = useState<{name: string, packageName: string}[]>([]);
  const [blockedPackages, setBlockedPackages] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [permissions, setPermissions] = useState({ usageStats: false, overlay: false });
  const [loading, setLoading] = useState(true);

  const isAndroid = !!(window as any).Android;

  const refreshApps = () => {
    if (isAndroid) {
      try {
        const appsStr = (window as any).Android.getInstalledApps();
        setApps(JSON.parse(appsStr).sort((a: any, b: any) => a.name.localeCompare(b.name)));
        
        const permsStr = (window as any).Android.checkPermissions();
        setPermissions(JSON.parse(permsStr));
      } catch (e) {
        console.error("Native Bridge error", e);
      }
    } else {
      // Mock for browser testing
      setApps([
        { name: 'YouTube', packageName: 'com.google.android.youtube' },
        { name: 'Roblox', packageName: 'com.roblox.client' },
        { name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
        { name: 'Minecraft', packageName: 'com.mojang.minecraftpe' }
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshApps();
    const saved = localStorage.getItem('blocked_packages');
    if (saved) setBlockedPackages(JSON.parse(saved));
  }, []);

  const toggleApp = (pkg: string) => {
    const newList = blockedPackages.includes(pkg) 
      ? blockedPackages.filter(p => p !== pkg)
      : [...blockedPackages, pkg];
    
    setBlockedPackages(newList);
    localStorage.setItem('blocked_packages', JSON.stringify(newList));
    
    if (isAndroid) {
      (window as any).Android.setBlockedApps(JSON.stringify(newList));
    }
  };

  const filteredApps = apps.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.packageName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black text-slate-900">App Locks</h1>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Select what to block</p>
            </div>
          </div>
          <button onClick={onBack} className="p-3 bg-white hover:bg-slate-100 rounded-xl shadow-sm border border-slate-200 transition-all">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {!isAndroid && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Native features are only available in the Android APK. Mocking apps for preview.</p>
          </div>
        )}

        {isAndroid && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className={`p-5 rounded-[2rem] border-2 transition-all ${permissions.usageStats ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <Smartphone className={`w-6 h-6 ${permissions.usageStats ? 'text-green-600' : 'text-red-600'}`} />
                {permissions.usageStats ? <ShieldCheck className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">Usage Stats</p>
              <p className="text-xs text-slate-500 mb-3">Needed to detect open apps</p>
              {!permissions.usageStats && (
                <button 
                  onClick={() => (window as any).Android.requestUsageStatsPermission()}
                  className="w-full py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700"
                >
                  Enable Permission
                </button>
              )}
            </div>

            <div className={`p-5 rounded-[2rem] border-2 transition-all ${permissions.overlay ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <Layers className={`w-6 h-6 ${permissions.overlay ? 'text-green-600' : 'text-red-600'}`} />
                {permissions.overlay ? <ShieldCheck className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">Overlay View</p>
              <p className="text-xs text-slate-500 mb-3">Needed to show lock screen</p>
              {!permissions.overlay && (
                <button 
                  onClick={() => (window as any).Android.requestOverlayPermission()}
                  className="w-full py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700"
                >
                  Enable Permission
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
          <div className="relative mb-6">
            <input 
              type="text"
              placeholder="Search apps..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <p className="text-center py-10 text-slate-400 animate-pulse">Scanning apps...</p>
            ) : filteredApps.length === 0 ? (
              <p className="text-center py-10 text-slate-400">No apps found</p>
            ) : filteredApps.map(app => (
              <button
                key={app.packageName}
                onClick={() => toggleApp(app.packageName)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  blockedPackages.includes(app.packageName) 
                    ? 'bg-red-50 border border-red-100' 
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-400 text-xs text-center p-1">
                    {app.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{app.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{app.packageName}</p>
                  </div>
                </div>
                {blockedPackages.includes(app.packageName) ? (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <Lock className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-slate-100 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-8 px-6">
          Apps selected here will be blocked until the child solves the required number of educational tasks.
        </p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<AppView | 'SUCCESS' | 'APP_MANAGEMENT'>(() => {
    // Check if we are being launched as a lock screen
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('lock') === 'true') return 'CHILD_LOCK';
    
    const isFirstRun = !localStorage.getItem('child_profile_saved');
    return isFirstRun ? 'SETTINGS' : 'CHILD_LOCK';
  });
  const [profile, setProfile] = useState<ChildProfile>(() => {
    const defaultProfile: ChildProfile = {
      name: '',
      age: 7,
      grade: 1,
      interests: '',
      language: 'Russian',
      taskCount: 3,
      preferredTaskType: 'SCHOOL_MATH',
      parentPin: '',
      skills: {} as any,
      history: []
    };
    const saved = localStorage.getItem('child_profile');
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
  });

  const saveProfile = (p: ChildProfile) => {
    setProfile(p);
    localStorage.setItem('child_profile', JSON.stringify(p));
    localStorage.setItem('child_profile_saved', 'true');
    setView('CHILD_LOCK');
  };

  const recordSuccess = () => {
    const currentSubject = profile.preferredTaskType;
    const currentSkills = profile.skills || {} as Record<TaskType, number>;
    const currentLevel = currentSkills[currentSubject] || 1;
    
    // Simple adaptive logic: increment level if session was successful (which it is here)
    const newLevel = Math.min(10, currentLevel + 0.1); // Slow progression 

    const newEntry = {
      date: new Date().toISOString(),
      tasksSolved: profile.taskCount,
      subject: currentSubject,
      successRate: 1 // In this screen, they only finish if they got them all right eventually
    };
    
    const updatedProfile = {
      ...profile,
      skills: {
        ...currentSkills,
        [currentSubject]: parseFloat(newLevel.toFixed(1))
      },
      history: [...(profile.history || []), newEntry].slice(-20)
    };
    
    setProfile(updatedProfile);
    localStorage.setItem('child_profile', JSON.stringify(updatedProfile));
    setView('SUCCESS');
  };

  return (
    <div className="font-sans selection:bg-indigo-100">
      <AnimatePresence mode="wait">
        {view === 'PIN' && (
          <motion.div key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PinScreen onUnlock={() => setView('SETTINGS')} correctPin={profile.parentPin} />
          </motion.div>
        )}
        
        {view === 'SETTINGS' && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ParentSettingsScreen 
              profile={profile} 
              onSave={saveProfile} 
              onBack={() => setView('CHILD_LOCK')}
              onManageApps={() => setView('APP_MANAGEMENT')}
            />
          </motion.div>
        )}

        {view === 'CHILD_LOCK' && (
          <motion.div key="child" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ChildScreen 
              profile={profile} 
              onStartTask={() => setView('TASK')} 
              onParentMode={() => setView('PIN')}
            />
          </motion.div>
        )}

        {view === 'TASK' && (
          <motion.div key="task" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TaskScreen 
              profile={profile} 
              onComplete={recordSuccess} 
              onParentMode={() => setView('PIN')}
            />
          </motion.div>
        )}

        {view === 'APP_MANAGEMENT' && (
          <motion.div key="app-mgmt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AppManagementScreen 
              onBack={() => setView('SETTINGS')}
            />
          </motion.div>
        )}

        {view === 'SUCCESS' && (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SuccessScreen onFinish={() => setView('CHILD_LOCK')} />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}
