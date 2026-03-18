import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, MessageSquare, Send, Sparkles, ChevronLeft, PlusCircle, Loader2, Users, User, AlertCircle, Key, Settings, ExternalLink, X } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateDiscussionGuide, handleDiscussionExpansion, type UserRole } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DiscussionState {
  verses: string;
  theme: string;
  role: UserRole;
  guide: string;
  chat: { role: 'user' | 'assistant'; content: string }[];
}

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [verses, setVerses] = useState('');
  const [theme, setTheme] = useState('');
  const [role, setRole] = useState<UserRole>('leader');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discussion, setDiscussion] = useState<DiscussionState | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (discussion) {
      scrollToBottom();
    }
  }, [discussion?.chat, isProcessing]);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      setShowSettings(false);
      setError(null);
    }
  };

  const handleStartDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      setError("Please add your Gemini API key in Settings to begin.");
      setShowSettings(true);
      return;
    }

    if (!verses || !theme) return;

    setIsGenerating(true);
    setError(null);
    try {
      const guide = await generateDiscussionGuide(verses, theme, role, apiKey);
      setDiscussion({
        verses,
        theme,
        role,
        guide: guide || '',
        chat: []
      });
    } catch (err: any) {
      console.error("Failed to generate guide:", err);
      setError(err.message || "An unexpected error occurred while preparing the Word. Please check your connection and try again.");
      if (err.message?.toLowerCase().includes("api key")) {
        setApiKey(null);
        setShowSettings(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExpansion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !discussion || !apiKey) return;

    const input = userInput;
    setUserInput('');
    setIsProcessing(true);

    // Add user message to chat
    setDiscussion(prev => prev ? {
      ...prev,
      chat: [...prev.chat, { role: 'user', content: input }]
    } : null);

    try {
      const response = await handleDiscussionExpansion(
        discussion.verses,
        discussion.theme,
        discussion.role,
        discussion.guide,
        discussion.chat,
        input,
        apiKey
      );
      
      setDiscussion(prev => prev ? {
        ...prev,
        chat: [...prev.chat, { role: 'assistant', content: response || '' }]
      } : null);
    } catch (err: any) {
      console.error("Failed to expand discussion:", err);
      setDiscussion(prev => prev ? {
        ...prev,
        chat: [...prev.chat, { role: 'assistant', content: "I apologize, I am having trouble connecting to the source of wisdom right now. Please try again in a moment." }]
      } : null);
      if (err.message?.toLowerCase().includes("api key")) {
        setApiKey(null);
        setShowSettings(true);
        setDiscussion(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setDiscussion(null);
    setVerses('');
    setTheme('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcf9]">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#5A5A40] text-white mb-4 shadow-md">
                <Key size={24} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#2c2c2c]">API Settings</h2>
              <p className="text-sm text-gray-500 font-serif italic mt-1">Provide your Gemini API key to enable AI features.</p>
            </div>

            <form onSubmit={handleApiKeySubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-semibold text-gray-500 ml-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="w-full p-4 rounded-2xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5A5A40] transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white py-4 rounded-full font-medium transition-all shadow-lg"
              >
                Save Settings
              </button>
            </form>

            <div className="mt-6 text-center">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-[#5A5A40] hover:underline flex items-center justify-center gap-1"
              >
                Get a free API key from Google AI Studio
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {!discussion ? (
        <div className="flex-1 flex flex-col items-center p-4 md:p-8">
          {/* Header */}
          <header className="w-full max-w-4xl mb-12 text-center mt-8 relative">
            <button 
              onClick={() => setShowSettings(true)}
              className="absolute right-0 top-0 p-3 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-[#5A5A40] transition-all hover:shadow-md"
              title="Settings"
            >
              <Settings size={24} />
            </button>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#5A5A40] text-white mb-6 shadow-lg">
              <BookOpen size={32} />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#2c2c2c] mb-4 tracking-tight">
              Shepherd's Guide
            </h1>
            <p className="text-lg text-gray-600 font-serif italic max-w-2xl mx-auto">
              "Thy word is a lamp unto my feet, and a light unto my path."
            </p>
          </header>

          <main className="w-full max-w-4xl">
            <div className="bg-white rounded-[32px] shadow-xl shadow-black/5 p-8 md:p-12 border border-gray-100">
              <h2 className="text-3xl font-serif font-semibold mb-8 text-center">Prepare Your Discussion</h2>
              
              {error && (
                <div className={cn(
                  "mb-8 p-4 rounded-2xl flex items-start gap-3",
                  error.includes("API key") ? "bg-amber-50 border border-amber-100 text-amber-700" : "bg-red-50 border border-red-100 text-red-700"
                )}>
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleStartDiscussion} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-semibold text-gray-500 ml-1">
                      Your Role
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('leader')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all",
                          role === 'leader' 
                            ? "bg-[#5A5A40] border-[#5A5A40] text-white" 
                            : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                        )}
                      >
                        <Users size={20} />
                        <span className="font-medium">Leader</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('participant')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all",
                          role === 'participant' 
                            ? "bg-[#5A5A40] border-[#5A5A40] text-white" 
                            : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                        )}
                      >
                        <User size={20} />
                        <span className="font-medium">Participant</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-semibold text-gray-500 ml-1">
                      Theme for the Day
                    </label>
                    <input
                      type="text"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      placeholder="e.g., Finding Peace in the Storm"
                      className="w-full p-4 rounded-2xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-semibold text-gray-500 ml-1">
                    Bible Verses
                  </label>
                  <textarea
                    value={verses}
                    onChange={(e) => setVerses(e.target.value)}
                    placeholder="e.g., Psalm 23:1-6, John 3:16"
                    className="w-full p-4 rounded-2xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5A5A40] transition-all min-h-[120px] text-lg"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white py-4 rounded-full font-medium text-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Preparing the Word...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate Guide
                    </>
                  )}
                </button>
              </form>
            </div>
          </main>

          <footer className="mt-16 pb-8 text-center text-gray-400 text-sm font-serif italic">
            "Let your speech always be with grace, seasoned with salt..." — Colossians 4:6
          </footer>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Sticky Header for Discussion Page */}
          <header className="sticky top-0 z-10 bg-[#fdfcf9]/80 backdrop-blur-md border-bottom border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={reset}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                title="Back to Setup"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-serif font-bold text-[#2c2c2c] line-clamp-1">{discussion.theme}</h1>
                  <span className="px-2 py-0.5 bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] uppercase tracking-wider font-bold rounded-full">
                    {discussion.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-serif italic">{discussion.verses}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-[#5A5A40] transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-medium hover:bg-[#4a4a34] transition-all shadow-sm"
              >
                <PlusCircle size={16} />
                <span className="hidden sm:inline">New Study</span>
              </button>
            </div>
          </header>

          <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 pb-32">
            <div className="space-y-12">
              {/* Main Guide Content */}
              <section className="bg-white rounded-[32px] shadow-xl shadow-black/5 p-8 md:p-12 border border-gray-100">
                <div className="markdown-body prose prose-stone max-w-none">
                  <Markdown>{discussion.guide}</Markdown>
                </div>
              </section>

              {/* Chat History */}
              {discussion.chat.length > 0 && (
                <section className="space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 text-center">Discussion Expansion</h3>
                  {discussion.chat.map((msg, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex flex-col",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[90%] p-6 rounded-[24px] text-base leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-[#5A5A40] text-white rounded-tr-none" 
                          : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                      )}>
                        {msg.role === 'assistant' ? (
                          <div className="markdown-body">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 opacity-90">
                            <MessageSquare size={16} />
                            <span className="font-medium">{msg.content}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {isProcessing && (
                <div className="flex items-start">
                  <div className="bg-white p-6 rounded-[24px] rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-3">
                    <Loader2 size={20} className="animate-spin text-[#5A5A40]" />
                    <span className="text-lg font-serif italic text-gray-500">Seeking deeper wisdom...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </main>

          {/* Fixed Bottom Chat Box */}
          <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#fdfcf9] via-[#fdfcf9] to-transparent">
            <div className="max-w-4xl mx-auto">
              <form 
                onSubmit={handleExpansion} 
                className="relative flex items-center bg-white rounded-full shadow-2xl border border-gray-100 p-2 pl-6 focus-within:ring-2 focus-within:ring-[#5A5A40] transition-all"
              >
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={discussion.role === 'leader' ? "Ask for more discussion points or help with a question..." : "Ask for personal insights or how to contribute..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 py-3 text-lg"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isProcessing}
                  className="p-4 bg-[#5A5A40] text-white rounded-full hover:bg-[#4a4a34] transition-all disabled:opacity-50 shadow-lg"
                >
                  <Send size={24} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
