// Triggering full repository sync after accidental deletion
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Settings, User, Baby, Brain, CheckCircle2, XCircle, ChevronRight, LogOut, Mic, Volume2, AlertCircle, RefreshCcw, HelpCircle, Info } from 'lucide-react';
import { AppView, ChildProfile, Task, TaskType } from './types';
import { generateTask, evaluateAudio, evaluateTextAnswer } from './services/geminiService';

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="text-blue-600 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Parental Control</h1>
        <p className="text-slate-500 mb-8">Enter 6-digit PIN to access settings</p>
        
        <div className="flex justify-center gap-3 mb-10">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > i ? 'bg-blue-600 border-blue-600 scale-110' : 'border-slate-300'
              } ${error ? 'bg-red-500 border-red-500 animate-shake' : ''}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'C'].map((btn, i) => (
            <button
              key={i}
              onClick={() => {
                if (btn === 'C') setPin('');
                else if (btn !== '') handlePin(btn.toString());
              }}
              className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                btn === '' ? 'invisible' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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

const ParentSettingsScreen = ({ profile, onSave, onBack }: { profile: ChildProfile, onSave: (p: ChildProfile) => void, onBack: () => void }) => {
  const [formData, setFormData] = useState<ChildProfile>(profile);
  const [showGuide, setShowGuide] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* ... existing header ... */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            Settings
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all"
            >
              <HelpCircle className="w-5 h-5" /> How to Lock?
            </button>
            <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <LogOut className="w-6 h-6 text-slate-500" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {localError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 font-bold overflow-hidden"
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              {localError}
            </motion.div>
          )}
        </AnimatePresence>
          {showGuide && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">Setup Guide</h2>
                </div>

                <div className="space-y-6 text-slate-600">
                  <section>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs">1</span>
                      Enable App Pinning
                    </h3>
                    <p className="text-sm">Go to <b>Settings</b> → <b>Security</b> → <b>Other Security Settings</b> → <b>App Pinning</b>. Turn it ON.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs">2</span>
                      Add to Home Screen
                    </h3>
                    <p className="text-sm">In Chrome, tap the <b>three dots (⋮)</b> and select <b>"Add to Home Screen"</b>. This makes the app look like a real app.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs">3</span>
                      Pin the App
                    </h3>
                    <p className="text-sm">Open the app from your Home Screen. Swipe up (or press the square button) to see <b>Recent Apps</b>. Tap the <b>App Icon</b> at the top and select <b>"Pin"</b> (or "Закрепить").</p>
                  </section>

                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800">Once pinned, the child cannot exit the app without your phone's password or a special gesture.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowGuide(false)}
                  className="w-full mt-8 bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all"
                >
                  Got it!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
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
  );
};

const ChildScreen = ({ profile, onStartTask, onParentMode }: { profile: ChildProfile, onStartTask: () => void, onParentMode: () => void }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-pink-400/20 rounded-full blur-3xl" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center z-10"
      >
        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <Baby className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tight">Hi, {profile.name}! 👋</h1>
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone access is required!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleAudioSubmit = async () => {
    if (!audioBlob || !task) return;
    setEvaluating(true);
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(',')[1];
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
    };
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
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mb-6"
        >
          <Brain className="w-16 h-16" />
        </motion.div>
        <h2 className="text-2xl font-bold animate-pulse">
          {solvedCount > 0 ? `Preparing task ${solvedCount + 1}...` : 'AI is thinking...'}
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
             task?.type === 'READING' ? 'Reading Aloud' : 'Retelling'}
          </span>
        </div>

        <div className="mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {(task?.type === 'SCHOOL_MATH' || task?.type === 'LOGIC') && (
            <p className="text-2xl font-bold leading-tight text-slate-700">{task.question}</p>
          )}
          {task?.type === 'READING' && (
            <div className="space-y-3">
              <p className="text-xs text-indigo-400 font-black uppercase tracking-widest">Read this text:</p>
              <p className="text-xl font-bold leading-relaxed bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 text-slate-800">{task.text}</p>
            </div>
          )}
          {task?.type === 'RETELLING' && (
            <div className="space-y-3">
              <p className="text-xs text-indigo-400 font-black uppercase tracking-widest">Listen/Read and retell:</p>
              <p className="text-xl font-bold leading-relaxed bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 text-slate-800">{task.story}</p>
            </div>
          )}
        </div>

        {(task?.type === 'SCHOOL_MATH' || task?.type === 'LOGIC') && (
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
              {isRecording && (
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
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
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

        {(task?.type === 'SCHOOL_MATH' || task?.type === 'LOGIC') && (
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

// --- Main App ---

export default function App() {
  const [view, setView] = useState<AppView>(() => {
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
      parentPin: ''
    };
    const saved = localStorage.getItem('child_profile');
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
  });

  const saveProfile = (p: ChildProfile) => {
    setProfile(p);
    localStorage.setItem('child_profile', JSON.stringify(p));
    localStorage.setItem('child_profile_saved', 'true');
    
    // Attempt to go fullscreen for better "lock" simulation
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.log("Fullscreen not supported or requires user gesture");
    }

    setView('CHILD_LOCK');
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
              onComplete={() => setView('CHILD_LOCK')} 
              onParentMode={() => setView('PIN')}
            />
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
