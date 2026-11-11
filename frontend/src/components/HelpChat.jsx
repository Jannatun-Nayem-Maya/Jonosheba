
import {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';

import { Link, useLocation } from 'react-router-dom';

import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';

// ==========================================
// JONOSEBA FLOATING HELP ASSISTANT
// ==========================================

// Features:
// - Works across all website pages
// - Bangla and English support
// - Chat-style interface
// - Verified FAQ answers
// - Live Jonoseba database answers
// - Quick question suggestions
// - Official source links
// - Responsive mobile interface
// - No paid AI API

// ==========================================
// QUICK QUESTIONS
// ==========================================

const QUICK_QUESTIONS = [
  {
    bn: 'জনসেবা কী?',
    en: 'What is Jonoseba?'
  },
  {
    bn: 'ত্রাণের জন্য কীভাবে আবেদন করব?',
    en: 'How can I apply for disaster relief?'
  },
  {
    bn: 'রক্তদাতা কীভাবে খুঁজব?',
    en: 'How can I find blood donors?'
  },
  {
    bn: 'বাংলাদেশের জাতীয় ফুল কী?',
    en: 'What is the national flower of Bangladesh?'
  },
  {
    bn: 'বাংলাদেশের জরুরি নম্বর কত?',
    en: 'What is the national emergency number of Bangladesh?'
  }
];

// ==========================================
// HELPERS
// ==========================================

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const getBilingualText = (value, language) => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  return (
    value[language] ||
    value.en ||
    value.bn ||
    ''
  );
};

const safeExternalUrl = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  try {
    const url = new URL(value);

    return ['http:', 'https:'].includes(
      url.protocol
    )
      ? url.href
      : null;
  } catch {
    return null;
  }
};

const safeInternalRoute = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\r\n]/.test(value)
  ) {
    return null;
  }

  return value;
};

const createWelcomeMessage = () => ({
  id: 'welcome',
  role: 'assistant',
  type: 'welcome',
  text: '',
  links: [],
  source: null,
  language: null
});

// ==========================================
// ANSWER LINKS
// ==========================================

function HelpChatLinks({
  links,
  language,
  onNavigate
}) {
  const items = safeArray(links);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="jfc-answer-links">
      {items.map((item, index) => {
        const label =
          getBilingualText(
            item.label,
            language
          ) ||
          (
            language === 'bn'
              ? 'বিস্তারিত দেখুন'
              : 'View Details'
          );

        if (item.type === 'internal') {
          const route = safeInternalRoute(
            item.url
          );

          if (!route) return null;

          return (
            <Link
              key={`internal-${index}`}
              to={route}
              onClick={onNavigate}
              className="jfc-answer-link"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" />
              <span>{label}</span>
            </Link>
          );
        }

        if (item.type === 'external') {
          const url = safeExternalUrl(
            item.url
          );

          if (!url) return null;

          return (
            <a
              key={`external-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="jfc-answer-link"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" />
              <span>{label}</span>
            </a>
          );
        }

        return null;
      })}
    </div>
  );
}

// ==========================================
// CHAT MESSAGE
// ==========================================

function HelpChatMessage({
  message,
  language,
  onNavigate
}) {
  const isUser = message.role === 'user';

  const messageText =
    message.type === 'welcome'
      ? language === 'bn'
        ? 'স্বাগতম! জনসেবা ওয়েবসাইট, বাংলাদেশের সাধারণ তথ্য এবং সরকারি সেবা সম্পর্কে প্রশ্ন করতে পারেন। নিচের একটি প্রশ্ন নির্বাচন করুন অথবা নিজে লিখুন।'
        : 'Welcome! Ask about Jonoseba services, Bangladesh general knowledge or government service guidance. Choose a question below or type your own.'
      : message.text;

  const sourceType =
    message.source?.type;

  const sourceLabel =
    sourceType === 'jonoseba_database'
      ? language === 'bn'
        ? 'জনসেবা ডাটাবেজ'
        : 'Jonoseba Database'
      : sourceType === 'jonoseba'
        ? language === 'bn'
          ? 'জনসেবা নির্দেশনা'
          : 'Jonoseba Guidance'
        : sourceType === 'official'
          ? language === 'bn'
            ? 'সরকারি উৎস'
            : 'Official Source'
          : sourceType === 'verified_knowledge'
            ? language === 'bn'
              ? 'যাচাইকৃত তথ্যভান্ডার'
              : 'Verified Knowledge Base'
            : null;

  return (
    <div
      className={`jfc-message ${
        isUser
          ? 'jfc-user-message'
          : 'jfc-assistant-message'
      }`}
    >
      {!isUser && (
        <span className="jfc-message-avatar">
          <i className="fa-solid fa-robot" />
        </span>
      )}

      <div className="jfc-message-content">
        <div className="jfc-message-bubble">
          <div className="jfc-message-text">
            {messageText}
          </div>

          {!isUser && sourceLabel && (
            <div className="jfc-source">
              <i className="fa-solid fa-shield-halved" />
              {' '}
              {sourceLabel}
            </div>
          )}

          {!isUser &&
            message.type === 'unanswered' && (
              <div className="jfc-warning">
                <i className="fa-solid fa-circle-info" />
                {' '}
                {language === 'bn'
                  ? 'যাচাইকৃত উত্তর পাওয়া যায়নি। ব্যক্তিগত তথ্য ছাড়া করা প্রশ্ন Admin review-এর জন্য সংরক্ষিত হতে পারে।'
                  : 'No verified answer was found. Questions without personal information may be recorded for admin review.'}
              </div>
            )}

          {!isUser && (
            <HelpChatLinks
              links={message.links}
              language={language}
              onNavigate={onNavigate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN FLOATING CHAT COMPONENT
// ==========================================

export default function HelpChat() {
  const { lang, t } = useLang();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    createWelcomeMessage()
  ]);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const requestSequenceRef = useRef(0);

  // ========================================
  // CLOSE ON ROUTE CHANGE
  // ========================================

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // ========================================
  // FOCUS INPUT WHEN OPENED
  // ========================================

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  // ========================================
  // ESCAPE KEY TO CLOSE
  // ========================================

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [open]);

  // ========================================
  // SCROLL TO LATEST MESSAGE
  // ========================================

  useEffect(() => {
    if (!open) return;

    messageEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }, [messages, sending, open]);

  // ========================================
  // ASK QUESTION
  // ========================================

  const askQuestion = useCallback(
    async (selectedQuestion) => {
      const cleaned = String(
        selectedQuestion || ''
      ).trim();

      if (!cleaned || sending) return;

      if (
        cleaned.length < 2 ||
        cleaned.length > 300
      ) {
        setError(
          lang === 'bn'
            ? 'প্রশ্ন ২ থেকে ৩০০ অক্ষরের মধ্যে লিখুন।'
            : 'Enter a question between 2 and 300 characters.'
        );
        return;
      }

      const requestId =
        ++requestSequenceRef.current;

      const currentLanguage = lang;

      // User message
      const userMessage = {
        id: `user-${requestId}`,
        role: 'user',
        type: 'question',
        text: cleaned,
        language: currentLanguage,
        source: null,
        links: []
      };

      setMessages((previous) => [
        ...previous,
        userMessage
      ]);

      setQuestion('');
      setError('');
      setSending(true);

      try {
        // Existing public Help Center backend
        const response = await api(
          '/help-center/ask',
          {
            method: 'POST',
            body: {
              question: cleaned,
              language: currentLanguage
            }
          }
        );

        const assistantMessage = {
          id: `answer-${requestId}`,
          role: 'assistant',
          type: response.type || 'faq',
          text:
            response.answer ||
            (
              currentLanguage === 'bn'
                ? 'উত্তর পাওয়া যায়নি।'
                : 'No answer was found.'
            ),
          language: currentLanguage,
          source: response.source || null,
          links: safeArray(response.links)
        };

        setMessages((previous) => [
          ...previous,
          assistantMessage
        ]);
      } catch (requestError) {
        const failureMessage = {
          id: `error-${requestId}`,
          role: 'assistant',
          type: 'error',
          text:
            currentLanguage === 'bn'
              ? 'দুঃখিত, সার্ভার থেকে উত্তর আনা সম্ভব হয়নি। পরে আবার চেষ্টা করুন।'
              : 'Sorry, the answer could not be retrieved from the server. Please try again.',
          language: currentLanguage,
          source: null,
          links: []
        };

        setMessages((previous) => [
          ...previous,
          failureMessage
        ]);

        setError(requestError.message);
      } finally {
        setSending(false);
      }
    },
    [lang, sending]
  );

  // ========================================
  // FORM SUBMIT
  // ========================================

  const handleSubmit = (event) => {
    event.preventDefault();
    askQuestion(question);
  };

  // ========================================
  // CLEAR CHAT
  // ========================================

  const clearChat = () => {
    if (sending) return;

    setMessages([
      createWelcomeMessage()
    ]);

    setQuestion('');
    setError('');

    inputRef.current?.focus();
  };

  // ========================================
  // CLOSE AFTER INTERNAL NAVIGATION
  // ========================================

  const closeAfterNavigation = () => {
    setOpen(false);
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <div className="jfc-root">

        {/* FLOATING CHAT WINDOW */}
        {open && (
          <section
            className="jfc-window"
            role="dialog"
            aria-modal="false"
            aria-label={t(
              'জনসেবা হেল্প অ্যাসিস্ট্যান্ট',
              'Jonoseba Help Assistant'
            )}
          >
            {/* HEADER */}
            <div className="jfc-header">
              <div className="jfc-header-left">
                <span className="jfc-header-icon">
                  <i className="fa-solid fa-robot" />
                </span>

                <div className="jfc-header-info">
                  <strong>
                    {t(
                      'জনসেবা অ্যাসিস্ট্যান্ট',
                      'Jonoseba Assistant'
                    )}
                  </strong>

                  <small>
                    <span className="jfc-online-dot" />

                    {t(
                      'বাংলা ও ইংরেজি সহায়তা',
                      'Bangla & English Support'
                    )}
                  </small>
                </div>
              </div>

              <div className="jfc-header-actions">
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={sending}
                  title={t(
                    'চ্যাট মুছুন',
                    'Clear Chat'
                  )}
                  aria-label={t(
                    'চ্যাট মুছুন',
                    'Clear Chat'
                  )}
                >
                  <i className="fa-solid fa-rotate-right" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    toggleRef.current?.focus();
                  }}
                  title={t('বন্ধ', 'Close')}
                  aria-label={t(
                    'চ্যাট বন্ধ করুন',
                    'Close Chat'
                  )}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            {/* MESSAGES */}
            <div
              className="jfc-messages"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.map((message) => (
                <HelpChatMessage
                  key={message.id}
                  message={message}
                  language={lang}
                  onNavigate={closeAfterNavigation}
                />
              ))}

              {/* TYPING INDICATOR */}
              {sending && (
                <div className="jfc-typing">
                  <span className="jfc-message-avatar">
                    <i className="fa-solid fa-robot" />
                  </span>

                  <div className="jfc-typing-dots">
                    <span />
                    <span />
                    <span />

                    <small>
                      {t(
                        'উত্তর খোঁজা হচ্ছে...',
                        'Finding an answer...'
                      )}
                    </small>
                  </div>
                </div>
              )}

              <div ref={messageEndRef} />
            </div>

            {/* QUICK QUESTIONS */}
            <div className="jfc-quick-section">
              <div className="jfc-quick-label">
                <i className="fa-solid fa-bolt" />
                {' '}
                {t(
                  'কিছু সাধারণ প্রশ্ন',
                  'Suggested Questions'
                )}
              </div>

              <div className="jfc-quick-list">
                {QUICK_QUESTIONS.map(
                  (item, index) => (
                    <button
                      type="button"
                      key={index}
                      disabled={sending}
                      onClick={() =>
                        askQuestion(item[lang])
                      }
                    >
                      {item[lang]}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div
                className="jfc-error"
                role="alert"
              >
                <i className="fa-solid fa-circle-exclamation" />
                {' '}
                {error}
              </div>
            )}

            {/* INPUT FORM */}
            <form
              className="jfc-input-form"
              onSubmit={handleSubmit}
            >
              <label
                htmlFor="jfc-question"
                className="jfc-sr-only"
              >
                {t(
                  'আপনার প্রশ্ন',
                  'Your question'
                )}
              </label>

              <input
                ref={inputRef}
                id="jfc-question"
                type="text"
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                placeholder={t(
                  'আপনার প্রশ্ন লিখুন...',
                  'Type your question...'
                )}
                maxLength={300}
                autoComplete="off"
                disabled={sending}
              />

              <button
                type="submit"
                disabled={
                  sending || !question.trim()
                }
                title={t(
                  'পাঠান',
                  'Send'
                )}
                aria-label={t(
                  'প্রশ্ন পাঠান',
                  'Send Question'
                )}
              >
                <i className="fa-solid fa-paper-plane" />
              </button>
            </form>

            {/* FOOTER */}
            <div className="jfc-footer">
              <div className="jfc-footer-note">
                <i className="fa-solid fa-shield-halved" />
                {' '}
                {t(
                  'যাচাইকৃত তথ্য • ব্যক্তিগত তথ্য লিখবেন না',
                  'Verified information • Do not share personal data'
                )}
              </div>

              <Link
                to="/help-center"
                onClick={closeAfterNavigation}
                className="jfc-full-link"
              >
                <i className="fa-solid fa-arrow-up-right-from-square" />
                {' '}
                {t(
                  'সম্পূর্ণ সহায়তা কেন্দ্র',
                  'Open Full Help Center'
                )}
              </Link>
            </div>
          </section>
        )}

        {/* FLOATING BUTTON */}
        <button
          ref={toggleRef}
          type="button"
          className={`jfc-floating-button ${
            open ? 'jfc-floating-open' : ''
          }`}
          onClick={() =>
            setOpen((previous) => !previous)
          }
          aria-expanded={open}
          aria-label={
            open
              ? t(
                  'হেল্প অ্যাসিস্ট্যান্ট বন্ধ করুন',
                  'Close Help Assistant'
                )
              : t(
                  'হেল্প অ্যাসিস্ট্যান্ট খুলুন',
                  'Open Help Assistant'
                )
          }
          title={t(
            'সহায়তা দরকার?',
            'Need Help?'
          )}
        >
          <i
            className={`fa-solid ${
              open
                ? 'fa-xmark'
                : 'fa-comments'
            }`}
          />

          {!open && (
            <span className="jfc-button-label">
              {t(
                'সহায়তা',
                'Help'
              )}
            </span>
          )}
        </button>

      </div>

      {/* ================================= */}
      {/* RESPONSIVE COMPONENT STYLES       */}
      {/* ================================= */}

      <style>{`
        .jfc-root {
          --jfc-green: #137d55;
          --jfc-dark-green: #0d6041;
          --jfc-light-green: #e9f7ef;
          --jfc-text: #1c2b3a;
          --jfc-muted: #68798d;
          --jfc-border: #e3e9ee;

          font-family: inherit;
        }

        .jfc-root *,
        .jfc-root *::before,
        .jfc-root *::after {
          box-sizing: border-box;
        }

        .jfc-floating-button {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2500;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          min-width: 62px;
          height: 58px;
          padding: 0 19px;

          border: 0;
          border-radius: 100px;

          background: var(--jfc-green);
          color: #ffffff;

          font-family: inherit;
          font-size: 17px;
          font-weight: 700;

          cursor: pointer;

          box-shadow:
            0 7px 24px rgba(9, 92, 57, .27);

          transition:
            background .2s,
            transform .2s,
            box-shadow .2s;
        }

        .jfc-floating-button:hover {
          background: var(--jfc-dark-green);
          transform: translateY(-2px);
          box-shadow:
            0 9px 28px rgba(9, 92, 57, .33);
        }

        .jfc-floating-button:focus-visible {
          outline: 3px solid #95d4b4;
          outline-offset: 3px;
        }

        .jfc-floating-button > i {
          font-size: 22px;
        }

        .jfc-button-label {
          font-size: 14px;
        }

        .jfc-floating-open {
          width: 58px;
          min-width: 58px;
          padding: 0;
        }

        .jfc-window {
          position: fixed;
          right: 24px;
          bottom: 94px;

          z-index: 2499;

          display: flex;
          flex-direction: column;

          width: min(390px, calc(100vw - 32px));
          height: min(585px, calc(100dvh - 120px));

          overflow: hidden;

          border: 1px solid var(--jfc-border);
          border-radius: 20px;

          background: #ffffff;
          color: var(--jfc-text);

          box-shadow:
            0 12px 48px rgba(18, 40, 53, .20);
        }

        .jfc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          flex-shrink: 0;

          padding: 15px 16px;

          background: var(--jfc-green);
          color: white;
        }

        .jfc-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .jfc-header-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;

          width: 42px;
          height: 42px;

          border-radius: 13px;

          background: rgba(255, 255, 255, .16);
          color: white;

          font-size: 20px;
        }

        .jfc-header-info {
          min-width: 0;
        }

        .jfc-header-info strong {
          display: block;
          color: white;
          font-size: 14px;
          line-height: 1.4;
        }

        .jfc-header-info small {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          color: #e5f5eb;
          font-size: 10px;
        }

        .jfc-online-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #bdf0ce;
        }

        .jfc-header-actions {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .jfc-header-actions button {
          display: grid;
          place-items: center;
          flex-shrink: 0;

          width: 32px;
          height: 32px;

          border: 0;
          border-radius: 9px;

          background: rgba(255, 255, 255, .13);
          color: white;

          font-size: 13px;
          cursor: pointer;
        }

        .jfc-header-actions button:hover {
          background: rgba(255, 255, 255, .23);
        }

        .jfc-header-actions button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .jfc-messages {
          flex: 1;
          min-height: 0;

          display: flex;
          flex-direction: column;
          gap: 14px;

          padding: 17px 12px;

          overflow-y: auto;
          overflow-x: hidden;

          background: #f8fafb;

          overscroll-behavior: contain;
        }

        .jfc-message {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .jfc-user-message {
          flex-direction: row-reverse;
        }

        .jfc-message-avatar {
          display: grid;
          place-items: center;
          flex-shrink: 0;

          width: 31px;
          height: 31px;
          border-radius: 11px;

          background: var(--jfc-light-green);
          color: var(--jfc-green);

          font-size: 15px;
        }

        .jfc-message-content {
          max-width: 86%;
          min-width: 0;
        }

        .jfc-message-bubble {
          padding: 12px 13px;

          border: 1px solid var(--jfc-border);
          border-radius: 5px 14px 14px 14px;

          background: #ffffff;
          color: var(--jfc-text);

          font-size: 12px;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }

        .jfc-user-message .jfc-message-bubble {
          border-color: var(--jfc-green);
          border-radius: 14px 5px 14px 14px;

          background: var(--jfc-green);
          color: white;
        }

        .jfc-message-text {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .jfc-source {
          margin-top: 10px;
          padding-top: 8px;

          border-top: 1px solid #ecf0f2;

          font-size: 10px;
          color: #657688;
        }

        .jfc-source i {
          color: var(--jfc-green);
        }

        .jfc-answer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 10px;
        }

        .jfc-answer-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 8px 9px;

          border: 1px solid #bedfcd;
          border-radius: 8px;

          background: #f0faf4;
          color: var(--jfc-dark-green);

          font-size: 11px;
          font-weight: 700;
          line-height: 1.4;
          text-decoration: none;
        }

        .jfc-answer-link:hover {
          background: #e2f5ea;
          color: var(--jfc-dark-green);
        }

        .jfc-warning {
          display: flex;
          align-items: flex-start;
          gap: 6px;

          margin-top: 10px;
          padding: 9px;

          border: 1px solid #eddfb8;
          border-radius: 8px;

          background: #fff8e9;
          color: #8b6726;

          font-size: 10px;
          line-height: 1.65;
        }

        .jfc-typing {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .jfc-typing-dots {
          display: flex;
          align-items: center;
          gap: 5px;

          padding: 12px;

          border: 1px solid var(--jfc-border);
          border-radius: 5px 14px 14px 14px;

          background: white;
        }

        .jfc-typing-dots > span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #88ac94;
          animation: jfcPulse 1.1s infinite ease-in-out;
        }

        .jfc-typing-dots > span:nth-child(2) {
          animation-delay: .15s;
        }

        .jfc-typing-dots > span:nth-child(3) {
          animation-delay: .3s;
        }

        .jfc-typing-dots small {
          margin-left: 6px;
          color: var(--jfc-muted);
          font-size: 10px;
        }

        @keyframes jfcPulse {
          0%, 60%, 100% {
            opacity: .3;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }

        .jfc-quick-section {
          flex-shrink: 0;
          padding: 11px 13px 7px;

          border-top: 1px solid var(--jfc-border);
          background: white;
        }

        .jfc-quick-label {
          font-size: 11px;
          font-weight: 700;
          color: #647387;
          margin-bottom: 8px;
        }

        .jfc-quick-label i {
          color: #c59b29;
        }

        .jfc-quick-list {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 8px 0;

          scrollbar-width: thin;
        }

        .jfc-quick-list button {
          flex-shrink: 0;

          max-width: 255px;
          padding: 8px 10px;

          border: 1px solid #d8e7dd;
          border-radius: 100px;

          background: #f5fbf7;
          color: #226747;

          font-family: inherit;
          font-size: 10px;
          line-height: 1.35;

          cursor: pointer;
        }

        .jfc-quick-list button:hover {
          background: #e5f6ed;
        }

        .jfc-quick-list button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .jfc-error {
          padding: 8px 13px;
          background: #fff2f2;
          color: #b23c3c;
          font-size: 11px;
        }

        .jfc-input-form {
          display: flex;
          align-items: center;
          gap: 8px;

          flex-shrink: 0;

          padding: 10px 12px;
          background: white;
        }

        .jfc-input-form input {
          flex: 1;
          min-width: 0;

          padding: 12px;

          border: 1px solid #dae3e9;
          border-radius: 11px;

          background: #f9fbfc;
          color: var(--jfc-text);

          font-family: inherit;
          font-size: 12px;

          outline: none;
        }

        .jfc-input-form input:focus {
          border-color: var(--jfc-green);
          box-shadow:
            0 0 0 3px rgba(19, 125, 85, .1);
        }

        .jfc-input-form > button {
          display: grid;
          place-items: center;
          flex-shrink: 0;

          width: 42px;
          height: 42px;

          border: 0;
          border-radius: 11px;

          background: var(--jfc-green);
          color: white;

          font-size: 15px;
          cursor: pointer;
        }

        .jfc-input-form > button:hover {
          background: var(--jfc-dark-green);
        }

        .jfc-input-form > button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .jfc-footer {
          flex-shrink: 0;

          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;

          padding: 9px 12px 12px;

          border-top: 1px solid var(--jfc-border);
          background: white;
        }

        .jfc-footer-note {
          color: #7a8997;
          font-size: 10px;
          text-align: center;
        }

        .jfc-footer-note i {
          color: var(--jfc-green);
        }

        .jfc-full-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          color: var(--jfc-green);
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
        }

        .jfc-full-link:hover {
          color: var(--jfc-dark-green);
          text-decoration: underline;
        }

        .jfc-sr-only {
          position: absolute !important;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 600px) {
          .jfc-floating-button {
            bottom: 15px;
            right: 15px;

            min-width: 55px;
            height: 55px;
            padding: 0 16px;
          }

          .jfc-floating-open {
            min-width: 55px;
            width: 55px;
            padding: 0;
          }

          .jfc-window {
            right: 10px;
            bottom: 81px;

            width: calc(100vw - 20px);
            height: min(
              570px,
              calc(100dvh - 105px)
            );

            border-radius: 16px;
          }

          .jfc-header {
            padding: 12px;
          }

          .jfc-messages {
            padding: 13px 10px;
          }

          .jfc-message-bubble {
            font-size: 12px;
          }
        }

        @media (max-width: 360px) {
          .jfc-button-label {
            display: none;
          }

          .jfc-floating-button {
            min-width: 54px;
            width: 54px;
            padding: 0;
          }

          .jfc-header-info strong {
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jfc-root *,
          .jfc-root *::before,
          .jfc-root *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </>
  );
}
