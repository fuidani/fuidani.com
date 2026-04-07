import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import styles from './RefinePage.module.css';

const PRIMARY_QUESTIONS = [
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
    chips: ['Last 12 months', 'Last 3 years', 'Last 5 years', 'Custom range'],
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

const EXTRA_QUESTIONS = [
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

  const [selections, setSelections] = useState({});
  const [textInputs, setTextInputs] = useState({});
  const [showMore, setShowMore] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const toggleChip = (questionId, chip) => {
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

  const handleTextInput = (questionId, value) => {
    setTextInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const isCardAnswered = (question) => {
    if (question.type === 'text') {
      return (textInputs[question.id] || '').trim().length > 0;
    }
    return (selections[question.id] || []).length > 0;
  };

  const allQuestions = [...PRIMARY_QUESTIONS, ...EXTRA_QUESTIONS];

  const timePeriodHasCustom = (selections['timePeriod'] || []).includes('Custom range');
  const timePeriodAnswered =
    (selections['timePeriod'] || []).length > 0 &&
    (!timePeriodHasCustom || (customFrom !== '' || customTo !== ''));

  const computeFilterCount = () => {
    let count = 0;
    for (const q of allQuestions) {
      if (q.id === 'timePeriod') {
        if (timePeriodAnswered) count++;
      } else if (isCardAnswered(q)) {
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

  const renderQuestionCard = (question) => {
    const answered =
      question.id === 'timePeriod'
        ? timePeriodAnswered
        : isCardAnswered(question);
    const cardClass = answered ? styles.questionCardAnswered : styles.questionCard;

    return (
      <div key={question.id} className={cardClass}>
        <div className={styles.questionHeader}>
          <div className={styles.questionNumber}>{question.number}</div>
          <div>
            <div className={styles.questionTitle}>{question.title}</div>
            <div className={styles.questionSubtitle}>{question.subtitle}</div>
          </div>
        </div>

        {question.type === 'text' ? (
          <input
            className={styles.miniInput}
            type="text"
            placeholder={question.placeholder}
            value={textInputs[question.id] || ''}
            onChange={(e) => handleTextInput(question.id, e.target.value)}
          />
        ) : (
          <>
            <div className={styles.optionChips}>
              {question.chips.map((chip) => {
                const selected = (selections[question.id] || []).includes(chip);
                return (
                  <button
                    type="button"
                    key={chip}
                    className={selected ? styles.optionChipSelected : styles.optionChip}
                    aria-pressed={selected}
                    onClick={() => toggleChip(question.id, chip)}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {question.id === 'timePeriod' && timePeriodHasCustom && (
              <div className={styles.inlineInputs}>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <span className={styles.sep}>to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <TopBar activeTab="search" />
      {/* Stepper Bar */}
      <div className={styles.stepperBar}>
        <div className={styles.stepper}>
          <div className={styles.stepDone}>
            <span className={styles.stepNumber}>&#10003;</span>
            <span className={styles.stepLabel}>Search</span>
          </div>
          <div className={styles.stepLineDone} />
          <div className={styles.stepActive}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>Refine</span>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>Results</span>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className={styles.page}>
       <div className={styles.pageInner}>
        {/* Query Context */}
        <div className={styles.queryContext}>
          <div className={styles.queryIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className={styles.queryText}>
            <div className={styles.queryLabel}>Your search</div>
            <div className={styles.queryValue}>{query}</div>
          </div>
          <button className={styles.queryEdit} onClick={goToSearch}>
            Edit
          </button>
        </div>

        {/* Intro */}
        <div className={styles.intro}>
          <h2>Help us narrow your results</h2>
          <p>
            Answer a few quick questions so we can find the most relevant cases for you.
            You can skip any question or go straight to results.
          </p>
        </div>

        {/* Primary Questions */}
        <div className={styles.questions}>
          {PRIMARY_QUESTIONS.map(renderQuestionCard)}
        </div>

        {/* More Filters Toggle */}
        <div className={styles.moreFilters}>
          <button
            className={showMore ? styles.moreToggleOpen : styles.moreToggle}
            onClick={() => setShowMore((prev) => !prev)}
          >
            {showMore ? 'Show fewer filters' : 'Show more filters'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className={showMore ? styles.extraQuestionsVisible : styles.extraQuestions}>
            {EXTRA_QUESTIONS.map(renderQuestionCard)}
          </div>
        </div>
       </div>
      </div>

      {/* Action Bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionInner}>
          <div className={styles.selectionSummary}>
            <strong>{actualFilterCount}</strong> filter{actualFilterCount !== 1 ? 's' : ''} applied
          </div>
          <div className={styles.actionButtons}>
            <button className={styles.btnSkip} onClick={goToResults}>
              Skip to results
            </button>
            <button
              className={styles.btnPrimary}
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
