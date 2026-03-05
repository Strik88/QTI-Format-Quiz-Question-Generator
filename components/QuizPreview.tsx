import React from 'react';
import { QuizData, QuestionType } from '../types';
import { CircleCheck as CheckCircle2, Circle as XCircle, FileQuestionMark as FileQuestion, List, Type } from 'lucide-react';

interface QuizPreviewProps {
  data: QuizData;
}

const QuestionIcon = ({ type }: { type: QuestionType }) => {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return <List className="w-5 h-5" style={{ color: '#4B99D2' }} />;
    case QuestionType.TRUE_FALSE:
      return <CheckCircle2 className="w-5 h-5" style={{ color: '#3BC5C9' }} />;
    case QuestionType.ESSAY:
    case QuestionType.SHORT_ANSWER:
      return <Type className="w-5 h-5" style={{ color: '#F27052' }} />;
    default:
      return <FileQuestion className="w-5 h-5 text-slate-400" />;
  }
};

const QuizPreview: React.FC<QuizPreviewProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold" style={{ color: '#1A2B50' }}>{data.title}</h2>
        {data.description && <p className="text-slate-600 mt-2">{data.description}</p>}
        <div
          className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'rgba(59,197,201,0.12)', color: '#1A8A8D' }}
        >
          {data.questions.length} Vragen gevonden
        </div>
      </div>

      <div className="space-y-4">
        {data.questions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white p-5 rounded-lg border border-slate-200 transition-all"
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,197,201,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0 rounded-lg p-2" style={{ backgroundColor: '#F7F9FC' }}>
                <QuestionIcon type={q.type} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-semibold text-lg" style={{ color: '#1A2B50' }}>
                    {idx + 1}. {q.text}
                  </h3>
                  <span
                    className="text-xs font-mono px-2 py-1 rounded shrink-0"
                    style={{ backgroundColor: '#F7F9FC', color: '#8A9BB5' }}
                  >
                    {q.points} pt
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {q.type === QuestionType.ESSAY || q.type === QuestionType.SHORT_ANSWER ? (
                    <div
                      className="p-3 rounded border text-sm italic"
                      style={{ backgroundColor: '#F7F9FC', borderColor: '#E2E8F0', color: '#A0AFBF' }}
                    >
                      Open antwoord veld
                    </div>
                  ) : (
                    <ul className="grid gap-2">
                      {q.answers.map(a => (
                        <li
                          key={a.id}
                          className="flex items-center gap-2 p-2 rounded border text-sm"
                          style={
                            a.isCorrect
                              ? { backgroundColor: 'rgba(59,197,201,0.08)', borderColor: 'rgba(59,197,201,0.35)', color: '#0E6E70' }
                              : { backgroundColor: '#FFFFFF', borderColor: '#F0F4F8', color: '#5A6A85' }
                          }
                        >
                          {a.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#3BC5C9' }} />
                          ) : (
                            <XCircle className="w-4 h-4 shrink-0 opacity-25" style={{ color: '#5A6A85' }} />
                          )}
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
