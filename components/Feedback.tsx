import React, { useState } from 'react';

interface FeedbackFormData {
  design: number;
  architecture: number;
  features: number;
  performance: number;
  usability: number;
  satisfaction: number;
  comment: string;
}

interface RatingNotes {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
}

const feedbackCategories = [
  { key: 'design', label: 'Design & UI' },
  { key: 'architecture', label: 'System Architecture' },
  { key: 'features', label: 'Features & Functions' },
  { key: 'performance', label: 'Performance' },
  { key: 'usability', label: 'Ease of Use' },
  { key: 'satisfaction', label: 'Overall Satisfaction' }
] as const;

const ratingLabels: Record<keyof Omit<FeedbackFormData, 'comment'>, RatingNotes> = {
  design: {
    1: 'Poor design',
    2: 'Basic design',
    3: 'Good design',
    4: 'Very good design',
    5: 'Excellent design'
  },
  architecture: {
    1: 'Confusing structure',
    2: 'Basic structure',
    3: 'Clear structure',
    4: 'Well organized',
    5: 'Perfect architecture'
  },
  features: {
    1: 'Limited features',
    2: 'Basic features',
    3: 'Good features',
    4: 'Rich features',
    5: 'Comprehensive'
  },
  performance: {
    1: 'Very slow',
    2: 'Somewhat slow',
    3: 'Acceptable',
    4: 'Fast',
    5: 'Lightning fast'
  },
  usability: {
    1: 'Hard to use',
    2: 'Basic usability',
    3: 'Easy to use',
    4: 'Very intuitive',
    5: 'Exceptional UX'
  },
  satisfaction: {
    1: 'Unsatisfied',
    2: 'Somewhat satisfied',
    3: 'Satisfied',
    4: 'Very satisfied',
    5: 'Extremely satisfied'
  }
};

const RatingNodes = ({ value, onChange, category }: {
  value: number;
  onChange: (value: number) => void;
  category: keyof Omit<FeedbackFormData, 'comment'>;
}) => {
  return (
    <div className="relative h-4 flex items-center">
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute w-full h-1 appearance-none bg-slate-700 rounded-full accent-cyan-400"
      />
      <div className="absolute inset-x-0 flex justify-between items-center px-[1px]">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            title={ratingLabels[category][rating as keyof RatingNotes]}
            className={`w-3 h-3 rounded-full transition-colors z-10 ${
              rating <= value
                ? 'bg-cyan-400 hover:bg-cyan-500'
                : 'bg-slate-700 hover:bg-slate-600'
            } border border-slate-900`}
          />
        ))}
      </div>
    </div>
  );
};

const Feedback: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackFormData>({
    design: 5,
    architecture: 5,
    features: 5,
    performance: 5,
    usability: 5,
    satisfaction: 5,
    comment: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Feedback submitted:', feedback);
    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setFeedback({
        design: 5,
        architecture: 5,
        features: 5,
        performance: 5,
        usability: 5,
        satisfaction: 5,
        comment: ''
      });
    }, 1400);
  };

  return (
    <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-2rem)]'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full rotate-90 bg-cyan-400 text-slate-900 px-2 py-1.5 rounded-t-lg shadow text-xs"
      >
        Feedback
      </button>

      <div className="bg-slate-900 text-slate-100 border border-slate-700 p-2.5 rounded-l-lg shadow-xl w-60">
        {submitted ? (
          <div className="text-center text-green-400 py-3 text-xs">Thanks!</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <h4 className="text-xs font-semibold border-b border-slate-700 pb-1.5">Quick Rating</h4>

            {feedbackCategories.map(({ key, label }) => (
              <div key={key} className="text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-300">{label}</label>
                  <span className="text-[10px] text-slate-400">
                    {ratingLabels[key as keyof Omit<FeedbackFormData, 'comment'>][feedback[key as keyof Omit<FeedbackFormData, 'comment'>] as keyof RatingNotes]}
                  </span>
                </div>
                <RatingNodes
                  value={feedback[key as keyof Omit<FeedbackFormData, 'comment'>]}
                  onChange={(value) => setFeedback(prev => ({ ...prev, [key]: value }))}
                  category={key as keyof Omit<FeedbackFormData, 'comment'>}
                />
              </div>
            ))}

            <div>
              <textarea
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({...prev, comment: e.target.value}))}
                placeholder="Optional comment..."
                maxLength={100}
                rows={2}
                className="w-full rounded bg-slate-800 border border-slate-700 p-1.5 text-[10px] text-slate-100 placeholder:text-slate-500 mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-400 text-slate-900 py-1 rounded text-[10px] font-medium hover:opacity-90 transition-opacity mt-1"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Feedback;