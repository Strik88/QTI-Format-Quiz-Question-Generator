import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Download, AlertCircle, RefreshCw, ClipboardType } from 'lucide-react';
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
      console.error(error);
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
      console.error(error);
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
      // Sanitize title for filename
      const safeTitle = quizData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${safeTitle}_canvas_import.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setState({ status: 'done', message: 'Download gestart!' });
    } catch (e) {
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="max-w-3xl w-full text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          <span className="text-indigo-600">Canvas</span> QTI Generator
        </h1>
        <p className="text-lg text-slate-600">
          Upload je vragen of plak je tekst, AI doet de rest. Importeer direct in Canvas LMS.
        </p>
      </div>

      <div className="max-w-4xl w-full space-y-8">
        
        {/* Input Section (Tabs) */}
        {!quizData && state.status !== 'analyzing' && state.status !== 'reading' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-4 text-sm font-medium text-center transition-colors flex items-center justify-center gap-2
                  ${activeTab === 'upload' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                `}
              >
                <Upload className="w-4 h-4" />
                Bestand Uploaden
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`flex-1 py-4 text-sm font-medium text-center transition-colors flex items-center justify-center gap-2
                  ${activeTab === 'paste' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                `}
              >
                <ClipboardType className="w-4 h-4" />
                Tekst Plakken
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {state.status === 'error' ? (
                 <div className="flex flex-col items-center text-red-600 animate-in fade-in zoom-in py-8">
                  <AlertCircle className="w-16 h-16 mb-4" />
                  <h3 className="text-xl font-semibold">Fout bij verwerken</h3>
                  <p className="mt-2 text-sm opacity-80">{state.message}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="mt-6 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium shadow-sm hover:bg-red-50"
                  >
                    Probeer opnieuw
                  </button>
                </div>
              ) : activeTab === 'upload' ? (
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept=".md,.txt" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Klik om te uploaden</h3>
                  <p className="mt-1 text-sm text-slate-500">Ondersteunt .md en .txt bestanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    className="w-full h-64 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 resize-none font-mono text-sm"
                    placeholder="Plak hier je vragen en antwoorden..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                  ></textarea>
                  <div className="flex justify-end">
                    <button
                      onClick={handleTextSubmit}
                      disabled={!pastedText.trim()}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      Genereer Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {(state.status === 'analyzing' || state.status === 'reading') && (
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-indigo-100 text-center animate-in fade-in zoom-in duration-300">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-indigo-200 blur-xl rounded-full opacity-50"></div>
              <div className="relative bg-white p-4 rounded-full shadow-sm">
                 <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Even geduld...</h3>
            <p className="text-slate-500">{state.message}</p>
          </div>
        )}

        {/* Results Area */}
        {quizData && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* Toolbar */}
            <div className="sticky top-4 z-10 bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="font-medium text-slate-700">Conversie succesvol</span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={reset}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Opnieuw
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={state.status === 'generating_zip'}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-6 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default App;