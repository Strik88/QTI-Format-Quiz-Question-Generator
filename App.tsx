import React, { useState, useRef } from 'react';
import { Upload, Loader as Loader2, Download, CircleAlert as AlertCircle, RefreshCw, ClipboardType, Circle as HelpCircle, Info } from 'lucide-react';
import { parseMarkdownToQuiz } from './services/geminiService';
import { createQtiZip } from './services/qtiService';
import { QuizData, ProcessingState } from './types';
import QuizPreview from './components/QuizPreview';

const App = () => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [state, setState] = useState<ProcessingState>({ status: 'idle', message: '' });
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processContent = async (text: string) => {
    if (!text.trim()) return;
    setState({ status: 'analyzing', message: 'AI is de vragen aan het extraheren...' });
    try {
      const parsedData = await parseMarkdownToQuiz(text);
      setQuizData(parsedData);
      setState({ status: 'done', message: 'Klaar!' });
    } catch (error: any) {
      console.error('[Striks QTI] processContent error:', error);
      setState({ status: 'error', message: error.message || 'Er is iets misgegaan.' });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setState({ status: 'reading', message: 'Bestand inlezen...' });
    try {
      const text = await file.text();
      await processContent(text);
    } catch (error: any) {
      console.error('[Striks QTI] handleFileUpload error:', error);
      setState({ status: 'error', message: error.message || 'Kon bestand niet lezen.' });
    }
  };

  const handleTextSubmit = () => {
    processContent(pastedText);
  };

  const handleDownload = async () => {
    if (!quizData) return;
    setState({ status: 'generating_zip', message: 'Zip bestand genereren...' });
    try {
      const blob = await createQtiZip(quizData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = quizData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${safeTitle}_canvas_import.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setState({ status: 'done', message: 'Download gestart!' });
    } catch (e: any) {
      console.error('[Striks QTI] handleDownload error:', e);
      setState({ status: 'error', message: 'Kon zip bestand niet maken.' });
    }
  };

  const reset = () => {
    setQuizData(null);
    setState({ status: 'idle', message: '' });
    setPastedText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F7F9FC' }}>

      {/* Top Navigation Bar */}
      <header style={{ backgroundColor: '#1A2B50' }} className="w-full shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/Striks_logo_M.png"
              alt="Striks logo"
              className="h-9 w-auto"
            />
            <span
              className="text-white font-semibold text-base hidden sm:block"
              style={{ letterSpacing: '0.04em' }}
            >
              Striks AI Consulting
            </span>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(59,197,201,0.18)', color: '#3BC5C9', letterSpacing: '0.06em' }}
          >
            Human Led AI Innovation
          </span>
        </div>
        <div className="h-0.5 w-full striks-gradient" />
      </header>

      {/* Page Content */}
      <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">

        {/* Hero Header */}
        <div className="max-w-3xl w-full text-center mb-10">
          <h1
            className="text-4xl font-extrabold tracking-tight mb-3"
            style={{ color: '#1A2B50', letterSpacing: '-0.5px' }}
          >
            Canvas{' '}
            <span className="striks-gradient-text">QTI Generator</span>
          </h1>
          <p className="text-lg" style={{ color: '#5A6A85' }}>
            Upload je vragen of plak je tekst — AI doet de rest. Importeer direct in Canvas LMS.
          </p>
        </div>

        <div className="max-w-4xl w-full space-y-8">

          {/* Input Section */}
          {!quizData && state.status !== 'analyzing' && state.status !== 'reading' && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-4 text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'upload' ? 'striks-tab-active' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Bestand Uploaden
                  </button>
                  <button
                    onClick={() => setActiveTab('paste')}
                    className={`flex-1 py-4 text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'paste' ? 'striks-tab-active' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ClipboardType className="w-4 h-4" />
                    Tekst Plakken
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  {state.status === 'error' ? (
                    <div className="flex flex-col items-center py-8" style={{ color: '#C53030' }}>
                      <AlertCircle className="w-16 h-16 mb-4" />
                      <h3 className="text-xl font-semibold">Fout bij verwerken</h3>
                      <p className="mt-2 text-sm opacity-80 text-center max-w-sm">{state.message}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="mt-6 px-5 py-2 bg-white border border-red-200 rounded-lg text-sm font-semibold shadow-sm hover:bg-red-50 transition-colors"
                      >
                        Probeer opnieuw
                      </button>
                    </div>
                  ) : activeTab === 'upload' ? (
                    <div
                      className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
                      style={{ borderColor: '#CBD5E0' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#3BC5C9')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E0')}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        accept=".md,.txt"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: 'rgba(59,197,201,0.12)' }}
                      >
                        <Upload className="w-8 h-8" style={{ color: '#3BC5C9' }} />
                      </div>
                      <h3 className="text-lg font-semibold" style={{ color: '#1A2B50' }}>Klik om te uploaden</h3>
                      <p className="mt-1 text-sm text-slate-500">Ondersteunt .md en .txt bestanden</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        className="w-full h-64 p-4 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 resize-none font-mono text-sm transition-all"
                        style={{ outline: 'none' }}
                        placeholder="Plak hier je vragen en antwoorden..."
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = '#3BC5C9';
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,197,201,0.25)';
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = '#CBD5E0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleTextSubmit}
                          disabled={!pastedText.trim()}
                          className="px-6 py-2.5 text-white rounded-lg font-semibold striks-btn-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          Genereer Quiz
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <HelpCircle className="w-6 h-6" style={{ color: '#3BC5C9' }} />
                  <h2 className="text-xl font-bold" style={{ color: '#1A2B50' }}>Hoe werkt het?</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      step: '1',
                      title: 'Invoer',
                      desc: 'Upload een Markdown of tekstbestand, of plak direct je tekst. De AI herkent automatisch vragen en antwoordopties.',
                    },
                    {
                      step: '2',
                      title: 'Controleer',
                      desc: 'Bekijk de gegenereerde preview. Je ziet direct welke vragen zijn herkend en wat de correcte antwoorden zijn.',
                    },
                    {
                      step: '3',
                      title: 'Download & Import',
                      desc: 'Download het QTI .zip bestand en importeer dit in Canvas via Instellingen > Cursusinhoud importeren.',
                    },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="space-y-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-base"
                        style={{ background: 'linear-gradient(135deg, #1A2B50 0%, #3BC5C9 100%)' }}
                      >
                        {step}
                      </div>
                      <h3 className="font-semibold" style={{ color: '#1A2B50' }}>{title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-xl p-4 flex gap-3"
                  style={{ backgroundColor: 'rgba(249,184,84,0.1)', border: '1px solid rgba(249,184,84,0.35)' }}
                >
                  <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#C4800A' }} />
                  <div className="text-sm" style={{ color: '#7A5500' }}>
                    <p className="font-semibold mb-1">Aanbevolen workflow voor de beste resultaten:</p>
                    <p className="mb-2">
                      Laad je bronbestanden (PDF's, docs, etc.) in <span className="font-bold">NotebookLM</span>, laat daar de gewenste vragen genereren en kopieer/plak de tekst vervolgens hier.
                    </p>
                    <p>De AI werkt het beste met gestructureerde tekst, maar kan ook overweg met ruwe tekst.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Loading State */}
          {(state.status === 'analyzing' || state.status === 'reading') && (
            <div className="bg-white p-12 rounded-2xl shadow-lg border border-slate-100 text-center">
              <div className="relative inline-block mb-6">
                <div
                  className="absolute inset-0 blur-xl rounded-full opacity-40"
                  style={{ background: 'linear-gradient(135deg, #3BC5C9, #1A2B50)' }}
                />
                <div className="relative bg-white p-4 rounded-full shadow-sm">
                  <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#3BC5C9' }} />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A2B50' }}>Even geduld...</h3>
              <p className="text-slate-500">{state.message}</p>
            </div>
          )}

          {/* Results Area */}
          {quizData && (
            <div className="space-y-6">
              <div className="sticky top-4 z-10 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: '#3BC5C9' }}
                  />
                  <span className="font-semibold" style={{ color: '#1A2B50' }}>Conversie succesvol</span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={reset}
                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Opnieuw
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={state.status === 'generating_zip'}
                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-6 py-2.5 text-white striks-btn-download rounded-lg font-semibold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {state.status === 'generating_zip' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Download ZIP voor Canvas
                  </button>
                </div>
              </div>

              <QuizPreview data={quizData} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto border-t border-slate-200 py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/Striks_logo_M.png" alt="Striks" className="h-6 w-auto opacity-80" />
            <span className="text-sm font-medium" style={{ color: '#8A9BB5' }}>Striks AI Consulting</span>
          </div>
          <span className="text-xs" style={{ color: '#B0BECC' }}>Human Led AI Innovation</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
