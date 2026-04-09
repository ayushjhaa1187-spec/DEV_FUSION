'use client';

import { memo } from 'react';

export interface QuestionCardProps {
  question: {
    id: string;
    question_text: string;
    options: string[];
  };
  questionIndex: number;
  selectedAnswer?: number;
  onSelect: (questionId: string, optionIndex: number) => void;
}

const QuestionCard = memo(function QuestionCard({
  question,
  questionIndex,
  selectedAnswer,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
      <p className="text-sm font-medium text-white">
        <strong>Q{questionIndex + 1}.</strong> {question.question_text}
      </p>
      <div className="flex flex-col gap-2">
        {question.options.map((opt, optIdx) => (
          <button
            key={optIdx}
            onClick={() => onSelect(question.id, optIdx)}
            className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-all ${
              selectedAnswer === optIdx
                ? 'border-purple-500 bg-purple-500/20 text-white'
                : 'border-white/10 hover:border-purple-500/40 text-gray-300 hover:bg-white/5'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
});

export default QuestionCard;
