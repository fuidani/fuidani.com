import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';

interface Question {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  chips?: string[];
  singleSelect?: boolean;
  type?: string;
  placeholder?: string;
}

const PRIMARY_QUESTIONS: Question[] = [
  {
    id: 'courtLevel',
    number: 1,
    title: 'What court level are you interested in?',
    subtitle: 'Select one or more',
    chips: ['Supreme Court', 'Court of Appeal', 'High Court', 'Tax Tribunal', 'Any level'],
  },
  {
    id: 'timePeriod',
    number: 2,
    title: 'What time period should we search?',
    subtitle: 'Select one',
    singleSelect: true,
    chips: ['Last month', 'Last 6 months', 'Last 12 months', 'Last 5 years', 'All time'],
  },
  {
    id: 'vatIssue',
    number: 3,
    title: 'Which VAT issue is most relevant?',
    subtitle: 'Select one or more',
    chips: [
      'Input Tax Deductions',
      'Exempt Supplies',
      'Zero-Rated Supplies',
      'Registration & Compliance',
      'Penalties & Interest',
      'Transfer Pricing',
    ],
  },
  {
    id: 'outcome',
    number: 4,
    title: 'Are you looking for a specific outcome?',
    subtitle: 'Select one or more',
    chips: ['Taxpayer won', 'Revenue Authority won', 'Partial / Mixed', 'Any outcome'],
  },
];

const EXTRA_QUESTIONS: Question[] = [
  {
    id: 'taxpayerType',
    number: 5,
    title: 'What type of taxpayer?',
    subtitle: 'Select one or more',
    chips: ['Individual', 'Corporation', 'SME', 'NGO / Non-profit', 'Government Entity'],
  },
  {
    id: 'disputedAmount',
    number: 6,
    title: 'Disputed amount range?',
    subtitle: 'Select one',
    chips: ['Any amount', 'Over 1M KES', 'Over 10M KES', 'Over 100M KES'],
  },
  {
    id: 'specificParty',
    number: 7,
    title: 'Looking for a specific party?',
    subtitle: 'Enter name if applicable',
    type: 'text',
    placeholder: 'e.g. Kenya Revenue Authority, ABC Ltd...',
  },
  {
    id: 'specificJudge',
    number: 8,
    title: 'Looking for a specific judge?',
    subtitle: 'Enter name if applicable',
    type: 'text',
    placeholder: 'e.g. Justice Odunga, Judge Mativo...',
  },
];

export default function RefinePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState(false);

  const toggleChip = (questionId: string, chip: string) => {
    const question = [...PRIMARY_QUESTIONS, ...EXTRA_QUESTIONS].find((q) => q.id === questionId);
    setSelections((prev) => {
      const current = prev[questionId] || [];
      if (current.includes(chip)) {
        return { ...prev, [questionId]: current.filter((c) => c !== chip) };
      }
      if (question?.singleSelect) {
        return { ...prev, [questionId]: [chip] };
      }
      return { ...prev, [questionId]: [...current, chip] };
    });
  };

  const handleTextInput = (questionId: string, value: string) => {
    setTextInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const isCardAnswered = (question: Question): boolean => {
    if (question.type === 'text') {
      return (textInputs[question.id] || '').trim().length > 0;
    }
    return (selections[question.id] || []).length > 0;
  };

  const allQuestions = [...PRIMARY_QUESTIONS, ...EXTRA_QUESTIONS];

  const computeFilterCount = (): number => {
    let count = 0;
    for (const q of allQuestions) {
      if (isCardAnswered(q)) {
        count++;
      }
    }
    return count;
  };

  const actualFilterCount = computeFilterCount();
  const hasFilters = actualFilterCount > 0;

  const goToResults = () => {
    navigate(`/results?q=${encodeURIComponent(query)}`);
  };

  const goToSearch = () => {
    navigate(`/?q=${encodeURIComponent(query)}`);
  };

  const renderQuestionCard = (question: Question) => {
    const answered = isCardAnswered(question);

    return (
      <div
        key={question.id}
        className={`bg-white border rounded-[14px] px-6 py-5 transition-[border-color,box-shadow] duration-200 hover:shadow-[0_1px_4px_rgba(0,0,0,0.04)] ${
          answered
            ? 'border-green-200 bg-green-50 hover:border-green-200'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-start gap-3 mb-[14px]">
          <div
            className={`w-6 h-6 rounded-full text-[0.75rem] font-semibold flex items-center justify-center flex-shrink-0 mt-px ${
              answered ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {question.number}
          </div>
          <div>
            <div className="text-[0.95rem] font-medium text-slate-800 leading-[1.4]">
              {question.title}
            </div>
            <div className="text-[0.8rem] text-slate-400 mt-0.5">{question.subtitle}</div>
          </div>
        </div>

        {question.type === 'text' ? (
          <input
            className="w-full px-3.5 py-2.5 text-[0.85rem] border border-slate-200 rounded-[9px] outline-none text-slate-800 bg-slate-50 mt-1 box-border transition-[border-color,box-shadow] duration-150 focus:border-yellow-600 focus:shadow-[0_0_0_2px_rgba(202,138,4,0.12)]"
            type="text"
            placeholder={question.placeholder}
            value={textInputs[question.id] || ''}
            onChange={(e) => handleTextInput(question.id, e.target.value)}
          />
        ) : (
          <div className="flex flex-wrap gap-2 mt-1">
            {question.chips!.map((chip) => {
              const selected = (selections[question.id] || []).includes(chip);
              return (
                <button
                  type="button"
                  key={chip}
                  className={`inline-block px-3.5 py-[7px] text-[0.82rem] font-[inherit] leading-[1.2] appearance-none rounded-[9px] cursor-pointer transition-all duration-150 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-600 focus-visible:outline-offset-2 ${
                    selected
                      ? 'bg-yellow-100 border border-yellow-600 text-amber-800 font-medium'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-yellow-50 hover:border-yellow-600 hover:text-slate-800'
                  }`}
                  aria-pressed={selected}
                  onClick={() => toggleChip(question.id, chip)}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at center top, rgba(202, 138, 4, 0.10), transparent 50%), linear-gradient(180deg, #fffdf7 0%, #f8fafc 100%)',
        height: 'var(--app-height)',
      }}
    >
      <TopBar activeTab="search" />

      {/* Stepper Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-center max-w-[600px] mx-auto">
          {/* Step 1 - Done */}
          <div className="flex items-center gap-2 text-[0.8rem] text-green-600 whitespace-nowrap">
            <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[0.75rem] font-semibold border-2 border-green-600 bg-green-600 text-white flex-shrink-0">
              &#10003;
            </span>
            <span className="max-sm:hidden">Search</span>
          </div>

          {/* Line - Done */}
          <div className="w-12 max-sm:w-6 h-0.5 bg-green-600 mx-3 max-sm:mx-1.5 flex-shrink-0" />

          {/* Step 2 - Active */}
          <div className="flex items-center gap-2 text-[0.8rem] text-slate-800 font-semibold whitespace-nowrap">
            <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[0.75rem] font-semibold border-2 border-slate-800 bg-slate-800 text-white flex-shrink-0">
              2
            </span>
            <span className="max-sm:hidden">Refine</span>
          </div>

          {/* Line */}
          <div className="w-12 max-sm:w-6 h-0.5 bg-slate-200 mx-3 max-sm:mx-1.5 flex-shrink-0" />

          {/* Step 3 */}
          <div className="flex items-center gap-2 text-[0.8rem] text-slate-400 whitespace-nowrap">
            <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[0.75rem] font-semibold border-2 border-slate-300 text-slate-400 flex-shrink-0">
              3
            </span>
            <span className="max-sm:hidden">Results</span>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-6 pt-8"
        style={{ paddingBottom: 'calc(120px + var(--app-safe-bottom))' }}
      >
        <div className="max-w-[760px] mx-auto">
          {/* Query Context */}
          <div className="bg-white border border-slate-200 rounded-[14px] px-6 py-5 mb-8 flex items-center gap-[14px] max-sm:flex-wrap">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[0.7rem] uppercase tracking-[0.06em] text-slate-400 mb-0.5">
                Your search
              </div>
              <div className="text-base font-medium text-slate-800">{query}</div>
            </div>
            <button
              className="text-[0.8rem] text-slate-500 bg-none border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer transition-all duration-150 hover:border-yellow-600 hover:text-slate-800"
              onClick={goToSearch}
            >
              Edit
            </button>
          </div>

          {/* Intro */}
          <div className="mb-7">
            <h2 className="text-[1.25rem] font-semibold mb-1.5">Help us narrow your results</h2>
            <p className="text-[0.9rem] text-slate-500 leading-[1.5]">
              Answer a few quick questions so we can find the most relevant cases for you. You can
              skip any question or{' '}
              <button
                className="bg-none border-0 p-0 font-[inherit] text-yellow-600 font-semibold cursor-pointer underline underline-offset-2 hover:text-yellow-700"
                onClick={goToResults}
              >
                go straight to results &rarr;
              </button>
            </p>
          </div>

          {/* Primary Questions */}
          <div className="flex flex-col gap-4 mb-8">
            {PRIMARY_QUESTIONS.map(renderQuestionCard)}
          </div>

          {/* More Filters Toggle */}
          <div className="text-center mb-7">
            <button
              className={`inline-flex items-center gap-1.5 text-[0.82rem] text-slate-500 bg-none border border-dashed border-slate-300 rounded-[10px] px-[18px] py-[9px] cursor-pointer transition-all duration-150 hover:border-slate-400 hover:text-slate-800 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:transition-transform [&_svg]:duration-200 ${
                showMore ? '[&_svg]:rotate-180' : ''
              }`}
              onClick={() => setShowMore((prev) => !prev)}
            >
              {showMore ? 'Show fewer filters' : 'Show more filters'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div
              className={`flex-col gap-4 mt-4 ${showMore ? 'flex' : 'hidden'}`}
            >
              {EXTRA_QUESTIONS.map(renderQuestionCard)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 z-[100]"
        style={{ padding: 'calc(14px) 24px calc(14px + var(--app-safe-bottom))' }}
      >
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3 max-sm:flex-col max-sm:text-center">
          <div className="text-[0.82rem] text-slate-500">
            <strong className="text-slate-800">{actualFilterCount}</strong> filter
            {actualFilterCount !== 1 ? 's' : ''} applied
          </div>
          <div className="flex gap-2.5 max-sm:w-full">
            <button
              className="px-[22px] py-2.5 text-[0.88rem] font-medium rounded-[10px] border-0 cursor-pointer transition-all duration-150 bg-none border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800 max-sm:flex-1 max-sm:justify-center"
              onClick={goToResults}
            >
              Skip to results
            </button>
            <button
              className="px-[22px] py-2.5 text-[0.88rem] font-medium rounded-[10px] border-0 cursor-pointer transition-all duration-150 bg-slate-800 text-white inline-flex items-center hover:enabled:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:opacity-60 max-sm:flex-1 max-sm:justify-center [&_svg]:w-[15px] [&_svg]:h-[15px] [&_svg]:ml-1.5 [&_svg]:align-[-2px]"
              disabled={!hasFilters}
              onClick={goToResults}
            >
              View results
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
