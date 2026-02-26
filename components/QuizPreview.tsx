import React from 'react';
import { QuizData, QuestionType } from '../types';
import { CheckCircle2, XCircle, FileQuestion, List, Type } from 'lucide-react';

interface QuizPreviewProps {
  data: QuizData;
}

const QuestionIcon = ({ type }: { type: QuestionType }) => {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE: return <List className="w-5 h-5 text-blue-500" />;
    case QuestionType.TRUE_FALSE: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case QuestionType.ESSAY:
    case QuestionType.SHORT_ANSWER: return <Type className="w-5 h-5 text-purple-500" />;
    default: return <FileQuestion className="w-5 h-5 text-gray-500" />;
  }
};

const QuizPreview: React.FC<QuizPreviewProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">{data.title}</h2>
        {data.description && <p className="text-slate-600 mt-2">{data.description}</p>}
        <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
          {data.questions.length} Vragen gevonden
        </div>
      </div>

      <div className="space-y-4">
        {data.questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-5 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0 bg-slate-50 p-2 rounded-lg">
                <QuestionIcon type={q.type} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-slate-800 text-lg">{idx + 1}. {q.text}</h3>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {q.points} pt
                  </span>
                </div>
                
                <div className="mt-4 space-y-2">
                  {q.type === QuestionType.ESSAY || q.type === QuestionType.SHORT_ANSWER ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-400 italic text-sm">
                      Open antwoord veld
                    </div>
                  ) : (
                    <ul className="grid gap-2">
                      {q.answers.map(a => (
                        <li 
                          key={a.id} 
                          className={`flex items-center gap-2 p-2 rounded border text-sm ${
                            a.isCorrect 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-white border-slate-100 text-slate-600'
                          }`}
                        >
                          {a.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4 opacity-30" />}
                          <span>{a.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizPreview;