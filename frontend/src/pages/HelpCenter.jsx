
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from 'react';

import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';

import {
  PageHeader,
  Loader,
  ErrorBox
} from '../components/ui.jsx';

// ==========================================
// JONOSEBA SMART HELP CENTER
// COMPLETE RESPONSIVE REDESIGN
// ==========================================

// ==========================================
// CATEGORIES
// ==========================================

const CATEGORIES = [
  {
    key: 'all',
    bn: 'সব প্রশ্ন',
    en: 'All Questions',
    icon: 'fa-layer-group'
  },
  {
    key: 'jonoseba',
    bn: 'জনসেবা',
    en: 'Jonoseba',
    icon: 'fa-house'
  },
  {
    key: 'blood',
    bn: 'রক্তদান',
    en: 'Blood Donation',
    icon: 'fa-droplet'
  },
  {
    key: 'scholarship',
    bn: 'বৃত্তি',
    en: 'Scholarships',
    icon: 'fa-graduation-cap'
  },
  {
    key: 'relief',
    bn: 'ত্রাণ সহায়তা',
    en: 'Relief Aid',
    icon: 'fa-hand-holding-heart'
  },
  {
    key: 'disaster',
    bn: 'দুর্যোগ',
    en: 'Disaster',
    icon: 'fa-triangle-exclamation'
  },
  {
    key: 'volunteer',
    bn: 'স্বেচ্ছাসেবক',
    en: 'Volunteer',
    icon: 'fa-people-group'
  },
  {
    key: 'welfare',
    bn: 'কল্যাণ',
    en: 'Welfare'
  },
  {
    key: 'complaint',
    bn: 'অভিযোগ',
    en: 'Complaints',
    icon: 'fa-clipboard-list'
  },
  {
    key: 'government',
    bn: 'সরকারি সেবা',
    en: 'Government Services',
    icon: 'fa-building-columns'
  },
  {
    key: 'bangladesh',
    bn: 'বাংলাদেশ',
    en: 'Bangladesh',
    icon: 'fa-book-open'
  },
  {
    key: 'emergency',
    bn: 'জরুরি সেবা',
    en: 'Emergency',
    icon: 'fa-phone-volume'
  },
  {
    key: 'health',
    bn: 'স্বাস্থ্য',
    en: 'Health',
    icon: 'fa-kit-medical'
  },
  {
    key: 'general',
    bn: 'সাধারণ',
    en: 'General',
    icon: 'fa-circle-info'
  }
];

// ==========================================
// QUICK QUESTIONS
// ==========================================

const QUICK_QUESTIONS = [
  {
    bn: 'জনসেবা কী?',
    en: 'What is Jonoseba?',
    icon: 'fa-circle-info'
  },
  {
    bn: 'ত্রাণের আবেদন কীভাবে করব?',
    en: 'How to apply for relief?',
    icon: 'fa-hand-holding-heart'
  },
  {
    bn: 'রক্তদাতা কীভাবে খুঁজব?',
    en: 'How to find blood donors?',
    icon: 'fa-droplet'
  },
  {
    bn: 'বৃত্তির তথ্য কোথায় পাব?',
    en: 'How to find scholarships?',
    icon: 'fa-graduation-cap'
  },
  {
    bn: 'বাংলাদেশের জাতীয় ফুল কী?',
    en: 'Bangladesh national flower?',
    icon: 'fa-leaf'
  },
  {
    bn: 'জরুরি সেবার নম্বর কত?',
    en: 'Emergency helpline number?',
    icon: 'fa-phone'
  }
];

// ==========================================
// USEFUL SERVICES
// ==========================================

const SERVICE_LINKS = [
  {
    path: '/services',
    bn: 'সকল সেবা',
    en: 'All Services',
    icon: 'fa-layer-group'
  },
  {
    path: '/blood-donors',
    bn: 'রক্তদাতা খুঁজুন',
    en: 'Find Blood Donors',
    icon: 'fa-droplet'
  },
  {
    path: '/scholarship',
    bn: 'বৃত্তির তথ্য',
    en: 'Scholarships',
    icon: 'fa-graduation-cap'
  },
  {
    path: '/disaster-alerts',
    bn: 'দুর্যোগ সতর্কতা',
    en: 'Disaster Alerts',
    icon: 'fa-triangle-exclamation'
  },
  {
    path: '/complaints',
    bn: 'অভিযোগ ও ট্র্যাকিং',
    en: 'Complaints & Tracking',
    icon: 'fa-clipboard-list'
  },
  {
    path: '/gov-services',
    bn: 'সরকারি ই-সেবা',
    en: 'Government E-Services',
    icon: 'fa-building-columns'
  }
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

function getBilingualText(value, language) {
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
}

function getCategoryName(category, language) {
  const match = CATEGORIES.find(
    (item) => item.key === category
  );

  return match
    ? match[language]
    : category || 'General';
}

function safeInternalRoute(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\r\n]/.test(value)
  ) {
    return null;
  }

  return value;
}

function safeExternalUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== 'https:' &&
      url.protocol !== 'http:'
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function formatDate(value, language) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(
    language === 'bn' ? 'bn-BD' : 'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  );
}

function formatTime(value, language) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString(
    language === 'bn' ? 'bn-BD' : 'en-GB',
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}

function createWelcomeMessage() {
  return {
    id: 'welcome',
    role: 'assistant',
    type: 'welcome',
    text: '',
    source: null,
    links: [],
    createdAt: new Date().toISOString()
  };
}

// ==========================================
// SOURCE INFORMATION
// ==========================================

function SourceInformation({
  source,
  language
}) {
  if (!source) return null;

  const labels = {
    jonoseba_database: {
      bn: 'জনসেবা ডাটাবেজ',
      en: 'Jonoseba Database'
    },
    jonoseba: {
      bn: 'জনসেবা নির্দেশনা',
      en: 'Jonoseba Guidance'
    },
    official: {
      bn: 'সরকারি উৎস',
      en: 'Official Source'
    },
    verified_knowledge: {
      bn: 'যাচাইকৃত তথ্যভান্ডার',
      en: 'Verified Knowledge Base'
    }
  };

  const label = getBilingualText(
    labels[source.type],
    language
  ) || (
    language === 'bn'
      ? 'তথ্যের উৎস'
      : 'Information Source'
  );

  return (
    <div className="jh-source">
      <i className="fa-solid fa-shield-halved" />

      <span>{label}</span>

      {source.verifiedAt && (
        <span className="jh-source-date">
          {language === 'bn'
            ? 'যাচাই: '
            : 'Verified: '}

          {formatDate(
            source.verifiedAt,
            language
          )}
        </span>
      )}
    </div>
  );
}

// ==========================================
// ANSWER LINKS
// ==========================================

function AnswerLinks({
  links,
  language
}) {
  const items = safeArray(links);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="jh-answer-links">
      {items.map((link, index) => {
        const label =
          getBilingualText(
            link.label,
            language
          ) ||
          (
            language === 'bn'
              ? 'বিস্তারিত দেখুন'
              : 'View Details'
          );

        if (link.type === 'internal') {
          const route = safeInternalRoute(
            link.url
          );

          if (!route) return null;

          return (
            <Link
              key={`${route}-${index}`}
              to={route}
              className="jh-answer-link"
            >
              <span>{label}</span>

              <i className="fa-solid fa-arrow-up-right-from-square" />
            </Link>
          );
        }

        if (link.type === 'external') {
          const url = safeExternalUrl(
            link.url
          );

          if (!url) return null;

          return (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="jh-answer-link"
            >
              <span>{label}</span>

              <i className="fa-solid fa-arrow-up-right-from-square" />
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

function ChatMessage({
  message,
  language
}) {
  const isUser = message.role === 'user';
  const isWelcome = message.type === 'welcome';

  const text = isWelcome
    ? language === 'bn'
      ? 'স্বাগতম! জনসেবার বিভিন্ন সেবা, রক্তদান, বৃত্তি, ত্রাণ, সরকারি সেবার নির্দেশনা এবং বাংলাদেশ সম্পর্কিত প্রশ্ন করতে পারেন। নিচের প্রশ্ন থেকে বেছে নিন অথবা নিজের প্রশ্ন লিখুন।'
      : 'Welcome! Ask about Jonoseba services, blood donation, scholarships, disaster relief, government services or Bangladesh. Choose a suggested question or type your own.'
    : message.text;

  return (
    <div
      className={`jh-message ${
        isUser
          ? 'jh-message-user'
          : 'jh-message-assistant'
      }`}
    >
      {!isUser && (
        <div className="jh-message-avatar">
          <i className="fa-solid fa-robot" />
        </div>
      )}

      <div className="jh-message-body">
        <div className="jh-bubble">

          {isWelcome && (
            <strong className="jh-welcome-title">
              {language === 'bn'
                ? 'জনসেবা সহায়তা কেন্দ্রে স্বাগতম'
                : 'Welcome to Jonoseba Help Center'}
            </strong>
          )}

          {!isUser &&
            message.category &&
            message.category !== 'general' && (
              <span className="jh-message-category">
                {getCategoryName(
                  message.category,
                  language
                )}
              </span>
            )}

          <div className="jh-message-text">
            {text}
          </div>

          {!isUser && (
            <>
              <SourceInformation
                source={message.source}
                language={language}
              />

              <AnswerLinks
                links={message.links}
                language={language}
              />

              {message.type === 'unanswered' && (
                <div className="jh-warning">
                  <i className="fa-solid fa-circle-info" />

                  <span>
                    {language === 'bn'
                      ? 'এই প্রশ্নের যাচাইকৃত উত্তর পাওয়া যায়নি। বিষয়টি পর্যালোচনার জন্য সংরক্ষিত হতে পারে।'
                      : 'No verified answer was found. This question may be recorded for review.'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {!isWelcome && (
          <small className="jh-message-time">
            {formatTime(
              message.createdAt,
              language
            )}
          </small>
        )}
      </div>
    </div>
  );
}

// ==========================================
// FAQ ACCORDION
// ==========================================

function FAQItem({
  item,
  language,
  onAsk
}) {
  const [expanded, setExpanded] =
    useState(false);

  const question =
    getBilingualText(
      item.bilingual?.question,
      language
    ) ||
    item.question;

  const answer =
    getBilingualText(
      item.bilingual?.answer,
      language
    ) ||
    item.answer;

  return (
    <article className="jh-faq-item">
      <button
        type="button"
        className="jh-faq-question"
        aria-expanded={expanded}
        onClick={() =>
          setExpanded((previous) => !previous)
        }
      >
        <span>
          <i className="fa-regular fa-circle-question" />

          {question}
        </span>

        <i
          className={`fa-solid ${
            expanded
              ? 'fa-chevron-up'
              : 'fa-chevron-down'
          }`}
        />
      </button>

      {expanded && (
        <div className="jh-faq-answer">
          <p>{answer}</p>

          <SourceInformation
            source={item.source}
            language={language}
          />

          <AnswerLinks
            links={item.links}
            language={language}
          />

          <button
            type="button"
            className="jh-ask-faq"
            onClick={() => onAsk(question)}
          >
            {language === 'bn'
              ? 'চ্যাটে প্রশ্ন করুন'
              : 'Ask in Chat'}

            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      )}
    </article>
  );
}

// ==========================================
// MAIN HELP CENTER PAGE
// ==========================================

export default function HelpCenter() {
  const { lang, t } = useLang();

  const [activeTab, setActiveTab] =
    useState('chat');

  const [question, setQuestion] =
    useState('');

  const [messages, setMessages] =
    useState(() => [
      createWelcomeMessage()
    ]);

  const [sending, setSending] =
    useState(false);

  const [chatError, setChatError] =
    useState('');

  const [faqs, setFaqs] =
    useState([]);

  const [faqLoading, setFaqLoading] =
    useState(true);

  const [faqError, setFaqError] =
    useState('');

  const [category, setCategory] =
    useState('all');

  const [faqSearch, setFaqSearch] =
    useState('');

  const [featured, setFeatured] =
    useState([]);

  const [featuredLoading, setFeaturedLoading] =
    useState(true);

  const [featuredError, setFeaturedError] =
    useState(false);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const requestSequence = useRef(0);
  const sendingRef = useRef(false);

  // ========================================
  // LOAD FEATURED QUESTIONS
  // ========================================

  useEffect(() => {
    let active = true;

    setFeaturedLoading(true);
    setFeaturedError(false);

    api(`/help-center/featured?lang=${lang}`)
      .then((data) => {
        if (!active) return;

        setFeatured(
          safeArray(data.items)
        );
      })
      .catch((error) => {
        if (!active) return;

        console.error(
          'Featured questions failed:',
          error
        );

        setFeatured([]);
        setFeaturedError(true);
      })
      .finally(() => {
        if (active) {
          setFeaturedLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [lang, refreshKey]);

  // ========================================
  // LOAD FAQ LIST
  // ========================================

  useEffect(() => {
    let active = true;

    const loadFAQs = async () => {
      setFaqLoading(true);
      setFaqError('');

      try {
        const params = new URLSearchParams({
          lang,
          category,
          limit: '50'
        });

        const data = await api(
          `/help-center/faqs?${params.toString()}`
        );

        if (!active) return;

        setFaqs(
          safeArray(data.items)
        );
      } catch (error) {
        if (!active) return;

        setFaqs([]);
        setFaqError(error.message);
      } finally {
        if (active) {
          setFaqLoading(false);
        }
      }
    };

    loadFAQs();

    return () => {
      active = false;
    };
  }, [lang, category, refreshKey]);

  // ========================================
  // CHAT SCROLL
  // ========================================

  useEffect(() => {
    if (
      activeTab !== 'chat' ||
      !messagesRef.current
    ) {
      return;
    }

    const area = messagesRef.current;

    area.scrollTop = area.scrollHeight;
  }, [
    messages,
    sending,
    activeTab
  ]);

  // ========================================
  // ASK ASSISTANT
  // ========================================

  const askQuestion = useCallback(
    async (selectedQuestion) => {
      const cleaned = String(
        selectedQuestion || ''
      ).trim();

      if (
        !cleaned ||
        sendingRef.current
      ) {
        return;
      }

      if (
        cleaned.length < 2 ||
        cleaned.length > 300
      ) {
        setChatError(
          lang === 'bn'
            ? 'প্রশ্ন ২ থেকে ৩০০ অক্ষরের মধ্যে লিখুন।'
            : 'Enter a question between 2 and 300 characters.'
        );

        return;
      }

      sendingRef.current = true;

      setSending(true);
      setChatError('');
      setQuestion('');
      setActiveTab('chat');

      const currentLanguage = lang;

      const id =
        ++requestSequence.current;

      setMessages((previous) => [
        ...previous,
        {
          id: `user-${id}`,
          role: 'user',
          type: 'question',
          text: cleaned,
          createdAt:
            new Date().toISOString()
        }
      ]);

      try {
        const result = await api(
          '/help-center/ask',
          {
            method: 'POST',
            body: {
              question: cleaned,
              language: currentLanguage
            }
          }
        );

        setMessages((previous) => [
          ...previous,
          {
            id: `assistant-${id}`,
            role: 'assistant',
            type: result.type || 'faq',
            text:
              result.answer ||
              (
                currentLanguage === 'bn'
                  ? 'উত্তর পাওয়া যায়নি।'
                  : 'No answer available.'
              ),
            category:
              result.category || 'general',
            source:
              result.source || null,
            links: safeArray(
              result.links
            ),
            createdAt:
              new Date().toISOString()
          }
        ]);
      } catch (error) {
        console.error(
          'Help Center API error:',
          error
        );

        setMessages((previous) => [
          ...previous,
          {
            id: `error-${id}`,
            role: 'assistant',
            type: 'error',
            text:
              currentLanguage === 'bn'
                ? `দুঃখিত, উত্তর আনা যায়নি। ${error.message}`
                : `Unable to retrieve an answer. ${error.message}`,
            links: [],
            source: null,
            createdAt:
              new Date().toISOString()
          }
        ]);

        setChatError(
          currentLanguage === 'bn'
            ? 'সার্ভারের সঙ্গে যোগাযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
            : 'There was a problem reaching the server. Please try again.'
        );
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [lang]
  );

  // ========================================
  // SUBMIT QUESTION
  // ========================================

  const handleSubmit = (event) => {
    event.preventDefault();

    askQuestion(question);
  };

  // ========================================
  // ASK FROM FAQ
  // ========================================

  const askFromFAQ = (selectedQuestion) => {
    setActiveTab('chat');

    if (sendingRef.current) {
      setQuestion(selectedQuestion);
      return;
    }

    askQuestion(selectedQuestion);
  };

  // ========================================
  // CLEAR CHAT
  // ========================================

  const clearChat = () => {
    if (sendingRef.current) return;

    setMessages([
      createWelcomeMessage()
    ]);

    setQuestion('');
    setChatError('');

    inputRef.current?.focus();
  };

  // ========================================
  // FILTER FAQ
  // ========================================

  const visibleFAQs = useMemo(() => {
    const search =
      faqSearch.trim().toLowerCase();

    if (!search) {
      return faqs;
    }

    return faqs.filter((item) => {
      const content = [
        item.question,
        item.answer,
        item.bilingual?.question?.bn,
        item.bilingual?.question?.en,
        item.bilingual?.answer?.bn,
        item.bilingual?.answer?.en,
        item.category
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return content.includes(search);
    });
  }, [faqs, faqSearch]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <PageHeader
        icon="fa-headset"
        tone="primary"
        title={t(
          'স্মার্ট সহায়তা কেন্দ্র',
          'Smart Help Center'
        )}
        subtitle={t(
          'জনসেবা এবং বাংলাদেশ সম্পর্কিত তথ্য সহজেই খুঁজুন',
          'Find information about Jonoseba and Bangladesh'
        )}
      />

      <div className="container section">
        <div className="jh-root">

          {/* ================================= */}
          {/* INTRODUCTION                      */}
          {/* ================================= */}

          <div className="jh-intro">
            <div className="jh-intro-icon">
              <i className="fa-solid fa-headset" />
            </div>

            <div className="jh-intro-text">
              <h2>
                {t(
                  'কী জানতে চান?',
                  'How can we help you?'
                )}
              </h2>

              <p>
                {t(
                  'প্রশ্ন করুন অথবা সাধারণ জিজ্ঞাসা থেকে উত্তর খুঁজুন।',
                  'Ask a question or browse frequently asked questions.'
                )}
              </p>
            </div>

            <div className="jh-status">
              <span className="jh-status-dot" />

              {t(
                'সহায়তা কেন্দ্র',
                'Help Center'
              )}
            </div>
          </div>

          {/* ================================= */}
          {/* TABS                              */}
          {/* ================================= */}

          <div className="jh-tabs">
            <button
              type="button"
              className={`jh-tab ${
                activeTab === 'chat'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('chat')
              }
            >
              <i className="fa-solid fa-comments" />

              {t(
                'প্রশ্ন করুন',
                'Ask Assistant'
              )}
            </button>

            <button
              type="button"
              className={`jh-tab ${
                activeTab === 'faqs'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('faqs')
              }
            >
              <i className="fa-solid fa-circle-question" />

              {t(
                'সাধারণ প্রশ্ন',
                'Frequently Asked Questions'
              )}
            </button>
          </div>

          {/* ================================= */}
          {/* CHAT LAYOUT                       */}
          {/* ================================= */}

          {activeTab === 'chat' && (
            <div className="jh-layout">

              {/* CHAT PANEL */}

              <section className="jh-chat-panel">

                {/* CHAT HEADER */}

                <div className="jh-chat-header">
                  <div className="jh-chat-title">
                    <div className="jh-chat-avatar">
                      <i className="fa-solid fa-robot" />
                    </div>

                    <div>
                      <h3>
                        {t(
                          'জনসেবা অ্যাসিস্ট্যান্ট',
                          'Jonoseba Assistant'
                        )}
                      </h3>

                      <p>
                        {t(
                          'বাংলা ও ইংরেজি সহায়তা',
                          'Bangla & English Support'
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="jh-clear-button"
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
                </div>

                {/* MESSAGES */}

                <div
                  ref={messagesRef}
                  className="jh-messages"
                  role="log"
                  aria-live="polite"
                >
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      language={lang}
                    />
                  ))}

                  {sending && (
                    <div className="jh-typing">
                      <div className="jh-message-avatar">
                        <i className="fa-solid fa-robot" />
                      </div>

                      <div className="jh-typing-bubble">
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
                </div>

                {/* ================================= */}
                {/* QUICK QUESTIONS                   */}
                {/* ================================= */}

                <div className="jh-quick-section">
                  <h4>
                    <i className="fa-solid fa-bolt" />

                    {t(
                      'দ্রুত প্রশ্ন',
                      'Suggested Questions'
                    )}
                  </h4>

                  <div className="jh-quick-grid">
                    {QUICK_QUESTIONS.map(
                      (item, index) => (
                        <button
                          type="button"
                          key={index}
                          className="jh-quick-button"
                          disabled={sending}
                          onClick={() =>
                            askQuestion(
                              item[lang]
                            )
                          }
                        >
                          <span>
                            {item[lang]}
                          </span>

                          <i className="fa-solid fa-arrow-right" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* ERROR MESSAGE */}

                {chatError && (
                  <div
                    className="jh-chat-error"
                    role="alert"
                  >
                    <span>
                      <i className="fa-solid fa-circle-exclamation" />

                      {chatError}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setChatError('')
                      }
                      aria-label={t(
                        'বন্ধ করুন',
                        'Dismiss'
                      )}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                )}

                {/* QUESTION INPUT */}

                <form
                  className="jh-input-section"
                  onSubmit={handleSubmit}
                >
                  <label
                    htmlFor="jh-question"
                    className="jh-visually-hidden"
                  >
                    {t(
                      'প্রশ্ন লিখুন',
                      'Enter Your Question'
                    )}
                  </label>

                  <input
                    ref={inputRef}
                    id="jh-question"
                    type="text"
                    value={question}
                    maxLength={300}
                    autoComplete="off"
                    disabled={sending}
                    placeholder={t(
                      'আপনার প্রশ্ন লিখুন...',
                      'Type your question here...'
                    )}
                    onChange={(event) =>
                      setQuestion(
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="submit"
                    disabled={
                      sending ||
                      !question.trim()
                    }
                    title={t(
                      'প্রশ্ন পাঠান',
                      'Send Question'
                    )}
                    aria-label={t(
                      'প্রশ্ন পাঠান',
                      'Send Question'
                    )}
                  >
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </form>

                {/* DISCLAIMER */}

                <div className="jh-disclaimer">
                  <i className="fa-solid fa-shield-halved" />

                  <span>
                    {t(
                      'যাচাইকৃত তথ্য ব্যবহার করা হয়। পাসওয়ার্ড বা ব্যক্তিগত তথ্য লিখবেন না।',
                      'Uses verified information. Do not share passwords or personal details.'
                    )}
                  </span>
                </div>
              </section>

              {/* ================================= */}
              {/* SIDEBAR                           */}
              {/* ================================= */}

              <aside className="jh-sidebar">

                {/* POPULAR QUESTIONS */}

                <div className="jh-side-card">
                  <h3>
                    <i className="fa-solid fa-star" />

                    {t(
                      'জনপ্রিয় প্রশ্ন',
                      'Popular Questions'
                    )}
                  </h3>

                  {featuredLoading ? (
                    <Loader />
                  ) : featuredError ? (
                    <div className="jh-side-error">
                      <p>
                        {t(
                          'প্রশ্ন লোড করা যায়নি।',
                          'Could not load questions.'
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setRefreshKey(
                            (previous) => previous + 1
                          )
                        }
                      >
                        {t(
                          'আবার চেষ্টা করুন',
                          'Try Again'
                        )}
                      </button>
                    </div>
                  ) : featured.length ? (
                    <div className="jh-popular-list">
                      {featured
                        .slice(0, 6)
                        .map((item) => {
                          const title =
                            getBilingualText(
                              item.bilingual?.question,
                              lang
                            ) || item.question;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              disabled={sending}
                              onClick={() =>
                                askQuestion(title)
                              }
                            >
                              <span className="jh-popular-text">
                                {title}
                              </span>

                              <i className="fa-solid fa-chevron-right" />
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="jh-empty-small">
                      {t(
                        'এখনো জনপ্রিয় প্রশ্ন যোগ করা হয়নি।',
                        'No popular questions available yet.'
                      )}
                    </p>
                  )}
                </div>

                {/* USEFUL SERVICES */}

                <div className="jh-side-card">
                  <h3>
                    <i className="fa-solid fa-link" />

                    {t(
                      'প্রয়োজনীয় সেবা',
                      'Useful Services'
                    )}
                  </h3>

                  <div className="jh-service-list">
                    {SERVICE_LINKS.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                      >
                        <i
                          className={`fa-solid ${item.icon}`}
                        />

                        <span>
                          {item[lang]}
                        </span>

                        <i className="fa-solid fa-chevron-right" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* SAFETY NOTE */}

                <div className="jh-safety-card">
                  <div className="jh-safety-heading">
                    <i className="fa-solid fa-shield-halved" />

                    <strong>
                      {t(
                        'নির্ভরযোগ্য তথ্য',
                        'Reliable Information'
                      )}
                    </strong>
                  </div>

                  <p>
                    {t(
                      'সরকারি সেবার নিয়ম পরিবর্তন হতে পারে। আবেদন করার আগে অফিসিয়াল ওয়েবসাইটে সর্বশেষ তথ্য যাচাই করুন।',
                      'Government service rules may change. Verify the latest requirements on official websites before applying.'
                    )}
                  </p>
                </div>
              </aside>
            </div>
          )}

          {/* ================================= */}
          {/* FAQ SECTION                       */}
          {/* ================================= */}

          {activeTab === 'faqs' && (
            <section className="jh-faq-panel">

              <div className="jh-faq-heading">
                <div>
                  <h2>
                    {t(
                      'সাধারণ জিজ্ঞাসা',
                      'Frequently Asked Questions'
                    )}
                  </h2>

                  <p>
                    {t(
                      'বিভাগ অনুযায়ী প্রশ্ন খুঁজুন এবং উত্তর পড়ুন।',
                      'Find questions by category and read their answers.'
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className="jh-switch-chat"
                  onClick={() =>
                    setActiveTab('chat')
                  }
                >
                  {t(
                    'অ্যাসিস্ট্যান্টকে প্রশ্ন করুন',
                    'Ask Assistant'
                  )}
                </button>
              </div>

              {/* SEARCH */}

              <div className="jh-search">
                <i className="fa-solid fa-magnifying-glass" />

                <input
                  type="search"
                  value={faqSearch}
                  placeholder={t(
                    'প্রশ্ন বা বিষয় খুঁজুন...',
                    'Search questions or topics...'
                  )}
                  onChange={(event) =>
                    setFaqSearch(
                      event.target.value
                    )
                  }
                />

                {faqSearch && (
                  <button
                    type="button"
                    onClick={() =>
                      setFaqSearch('')
                    }
                    aria-label={t(
                      'সার্চ মুছুন',
                      'Clear Search'
                    )}
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>

              {/* CATEGORY FILTER */}

              <div className="jh-category-list">
                {CATEGORIES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`jh-category-button ${
                      category === item.key
                        ? 'active'
                        : ''
                    }`}
                    aria-pressed={
                      category === item.key
                    }
                    onClick={() =>
                      setCategory(item.key)
                    }
                  >
                    {item[lang]}
                  </button>
                ))}
              </div>

              {/* FAQ COUNT */}

              <div className="jh-faq-results-heading">
                <strong>
                  {t(
                    'প্রশ্ন ও উত্তর',
                    'Questions and Answers'
                  )}
                </strong>

                {!faqLoading && !faqError && (
                  <span>
                    {visibleFAQs.length}{' '}
                    {t(
                      'টি প্রশ্ন',
                      'questions'
                    )}
                  </span>
                )}
              </div>

              {/* LOADING */}

              {faqLoading && (
                <Loader
                  text={t(
                    'প্রশ্ন লোড হচ্ছে...',
                    'Loading FAQs...'
                  )}
                />
              )}

              {/* ERROR */}

              {faqError && (
                <div className="jh-faq-error">
                  <ErrorBox message={faqError} />

                  <button
                    type="button"
                    className="jh-retry-button"
                    onClick={() =>
                      setRefreshKey(
                        (previous) => previous + 1
                      )
                    }
                  >
                    {t(
                      'আবার চেষ্টা করুন',
                      'Try Again'
                    )}
                  </button>
                </div>
              )}

              {/* EMPTY STATE */}

              {!faqLoading &&
                !faqError &&
                visibleFAQs.length === 0 && (
                  <div className="jh-empty-state">
                    <i className="fa-regular fa-circle-question" />

                    <h3>
                      {t(
                        'কোনো প্রশ্ন পাওয়া যায়নি',
                        'No Questions Found'
                      )}
                    </h3>

                    <p>
                      {t(
                        'অন্য বিষয় খুঁজুন অথবা অ্যাসিস্ট্যান্টকে প্রশ্ন করুন।',
                        'Try another search or ask the assistant.'
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab('chat')
                      }
                    >
                      {t(
                        'প্রশ্ন করুন',
                        'Ask a Question'
                      )}
                    </button>
                  </div>
                )}

              {/* FAQ ITEMS */}

              {!faqLoading &&
                !faqError &&
                visibleFAQs.length > 0 && (
                  <div className="jh-faq-list">
                    {visibleFAQs.map((item) => (
                      <FAQItem
                        key={item.id}
                        item={item}
                        language={lang}
                        onAsk={askFromFAQ}
                      />
                    ))}
                  </div>
                )}

              <div className="jh-faq-footer">
                <i className="fa-solid fa-circle-info" />

                {t(
                  'প্রকাশিত উত্তরগুলো Admin পরিচালিত knowledge base থেকে আসে।',
                  'Published answers come from an admin-managed knowledge base.'
                )}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* ================================= */}
      {/* COMPLETE RESPONSIVE CSS            */}
      {/* ================================= */}

      <style>{`

        /* ==================================
           GENERAL
           ================================== */

        .jh-root {
          --jh-primary: #117b51;
          --jh-primary-dark: #075d3a;
          --jh-primary-light: #eaf6ef;
          --jh-text: #1b2b3e;
          --jh-secondary: #41546b;
          --jh-muted: #66778a;
          --jh-border: #dfe7e4;
          --jh-surface: #f8faf9;

          width: 100%;
          color: var(--jh-text);
        }

        .jh-root *,
        .jh-root *::before,
        .jh-root *::after {
          box-sizing: border-box;
        }

        .jh-root button,
        .jh-root input {
          font-family: inherit;
        }

        /* ==================================
           INTRODUCTION
           ================================== */

        .jh-intro {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 23px;
          margin-bottom: 21px;

          background: #ffffff;
          border: 1px solid var(--jh-border);
          border-radius: 16px;
        }

        .jh-intro-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;

          width: 54px;
          height: 54px;

          border-radius: 14px;
          background: var(--jh-primary-light);
          color: var(--jh-primary);
          font-size: 24px;
        }

        .jh-intro-text {
          min-width: 0;
          flex: 1;
        }

        .jh-intro-text h2 {
          margin: 0 0 5px;
          color: var(--jh-text);
          font-size: 22px;
          font-weight: 800;
          line-height: 1.35;
        }

        .jh-intro-text p {
          margin: 0;
          color: var(--jh-muted);
          font-size: 15px;
          line-height: 1.6;
        }

        .jh-status {
          display: flex;
          align-items: center;
          gap: 8px;

          flex-shrink: 0;
          padding: 9px 13px;

          background: var(--jh-primary-light);
          color: var(--jh-primary-dark);
          border-radius: 30px;

          font-size: 12px;
          font-weight: 700;
        }

        .jh-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #18a566;
        }

        /* ==================================
           TABS
           ================================== */

        .jh-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }

        .jh-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          padding: 13px 19px;
          border: 1px solid var(--jh-border);
          border-radius: 11px;

          background: white;
          color: #33465d;

          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .jh-tab.active {
          color: white;
          background: var(--jh-primary);
          border-color: var(--jh-primary);
        }

        .jh-tab:hover:not(.active) {
          background: var(--jh-primary-light);
        }

        /* ==================================
           MAIN LAYOUT
           ================================== */

        .jh-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 1.8fr)
            minmax(285px, .85fr);

          align-items: start;
          gap: 20px;
        }

        /* ==================================
           CHAT PANEL
           ================================== */

        .jh-chat-panel {
          display: flex;
          flex-direction: column;
          min-width: 0;

          background: white;
          border: 1px solid var(--jh-border);
          border-radius: 17px;
          overflow: hidden;
        }

        .jh-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          flex-shrink: 0;

          padding: 16px 19px;
          border-bottom: 1px solid var(--jh-border);
          background: white;
        }

        .jh-chat-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .jh-chat-avatar,
        .jh-message-avatar {
          display: grid;
          place-items: center;
          flex-shrink: 0;

          background: var(--jh-primary-light);
          color: var(--jh-primary);
        }

        .jh-chat-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          font-size: 20px;
        }

        .jh-chat-title h3 {
          margin: 0 0 3px;
          font-size: 17px;
          font-weight: 800;
          color: var(--jh-text);
        }

        .jh-chat-title p {
          margin: 0;
          color: var(--jh-muted);
          font-size: 12px;
        }

        .jh-clear-button {
          display: grid;
          place-items: center;

          width: 40px;
          height: 40px;

          border: 1px solid var(--jh-border);
          border-radius: 10px;

          background: white;
          color: var(--jh-secondary);
          font-size: 15px;
          cursor: pointer;
        }

        .jh-clear-button:hover {
          background: var(--jh-primary-light);
        }

        .jh-clear-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        /* ==================================
           CHAT MESSAGES
           ================================== */

        .jh-messages {
          display: flex;
          flex-direction: column;
          gap: 18px;

          height: 400px;
          min-height: 400px;

          padding: 20px 17px;

          overflow-y: auto;
          overflow-x: hidden;

          background: #f8fafc;
          overscroll-behavior: contain;
        }

        .jh-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
        }

        .jh-message-user {
          flex-direction: row-reverse;
        }

        .jh-message-avatar {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          font-size: 16px;
        }

        .jh-message-body {
          display: flex;
          flex-direction: column;
          max-width: 87%;
          min-width: 0;
        }

        .jh-message-user .jh-message-body {
          align-items: flex-end;
        }

        .jh-bubble {
          padding: 14px 16px;
          border: 1px solid var(--jh-border);
          border-radius: 5px 14px 14px 14px;

          background: white;
          color: var(--jh-text);

          font-size: 15px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .jh-message-user .jh-bubble {
          background: var(--jh-primary);
          border-color: var(--jh-primary);
          color: white;
          border-radius: 14px 5px 14px 14px;
        }

        .jh-welcome-title {
          display: block;
          margin-bottom: 7px;
          font-size: 15px;
          font-weight: 800;
        }

        .jh-message-text {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .jh-message-category {
          display: inline-flex;
          padding: 4px 8px;
          margin-bottom: 8px;

          background: var(--jh-primary-light);
          color: var(--jh-primary-dark);
          border-radius: 6px;

          font-size: 11px;
          font-weight: 700;
        }

        .jh-message-time {
          display: block;
          padding: 5px 3px 0;

          color: #77869a;
          font-size: 11px;
        }

        .jh-source {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;

          padding-top: 10px;
          margin-top: 11px;
          border-top: 1px solid #e8eeec;

          color: #586b7d;
          font-size: 11px;
        }

        .jh-source i {
          color: var(--jh-primary);
        }

        .jh-source-date {
          margin-left: auto;
        }

        .jh-answer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 11px;
        }

        .jh-answer-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding: 8px 11px;
          border: 1px solid #bcdccb;
          border-radius: 9px;

          background: #f0faf4;
          color: var(--jh-primary-dark);

          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .jh-answer-link:hover {
          background: #e0f3e7;
        }

        .jh-warning {
          display: flex;
          gap: 8px;
          align-items: flex-start;

          margin-top: 11px;
          padding: 10px;

          background: #fff8e8;
          border: 1px solid #e9dcb8;
          border-radius: 8px;

          color: #806123;
          font-size: 12px;
        }

        .jh-typing {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .jh-typing-bubble {
          display: flex;
          align-items: center;
          gap: 5px;

          padding: 14px;
          border: 1px solid var(--jh-border);
          border-radius: 5px 14px 14px 14px;
          background: white;
        }

        .jh-typing-bubble > span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--jh-primary);
          animation: jhPulse 1s infinite ease-in-out;
        }

        .jh-typing-bubble > span:nth-child(2) {
          animation-delay: .15s;
        }

        .jh-typing-bubble > span:nth-child(3) {
          animation-delay: .3s;
        }

        .jh-typing-bubble small {
          margin-left: 7px;
          color: var(--jh-muted);
          font-size: 11px;
        }

        @keyframes jhPulse {
          0%, 60%, 100% {
            opacity: .3;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }

        /* ==================================
           QUICK QUESTIONS
           ================================== */

        .jh-quick-section {
          flex-shrink: 0;

          padding: 17px 19px;
          background: white;
          border-top: 1px solid var(--jh-border);
        }

        .jh-quick-section h4 {
          display: flex;
          align-items: center;
          gap: 9px;

          margin: 0 0 13px;

          color: var(--jh-text);
          font-size: 16px;
          font-weight: 800;
        }

        .jh-quick-section h4 i {
          color: #bf901c;
        }

        .jh-quick-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .jh-quick-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          width: 100%;
          min-height: 49px;
          padding: 12px 14px;

          background: #f7faf8;
          border: 1px solid #d7e6dc;
          border-radius: 10px;

          color: #234336;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.45;
          text-align: left;

          cursor: pointer;
        }

        .jh-quick-button span {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .jh-quick-button > i {
          flex-shrink: 0;
          color: var(--jh-primary);
          font-size: 12px;
        }

        .jh-quick-button:hover {
          background: #e8f5ed;
          border-color: #a8d3b9;
          color: var(--jh-primary-dark);
        }

        .jh-quick-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        /* ==================================
           CHAT INPUT
           ================================== */

        .jh-input-section {
          display: flex;
          align-items: center;
          gap: 10px;

          flex-shrink: 0;
          padding: 13px 19px;

          background: white;
          border-top: 1px solid var(--jh-border);
        }

        .jh-input-section input {
          flex: 1;
          min-width: 0;

          padding: 14px 15px;
          border: 2px solid #d6e2db;
          border-radius: 11px;

          background: white;
          color: #172c3d;

          font-size: 16px;
          outline: none;
        }

        .jh-input-section input::placeholder {
          color: #67788a;
          opacity: 1;
        }

        .jh-input-section input:focus {
          border-color: var(--jh-primary);
          box-shadow:
            0 0 0 3px rgba(17, 123, 81, .10);
        }

        .jh-input-section > button {
          display: grid;
          place-items: center;
          flex-shrink: 0;

          width: 48px;
          height: 48px;

          background: var(--jh-primary);
          border: 0;
          border-radius: 11px;

          color: white;
          font-size: 18px;
          cursor: pointer;
        }

        .jh-input-section > button:hover {
          background: var(--jh-primary-dark);
        }

        .jh-input-section > button:disabled {
          background: #a0c7b4;
          cursor: not-allowed;
        }

        .jh-chat-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          padding: 10px 18px;
          background: #fff0f0;
          color: #963636;

          font-size: 12px;
        }

        .jh-chat-error > span {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .jh-chat-error button {
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .jh-disclaimer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          flex-shrink: 0;
          padding: 11px 17px;

          border-top: 1px solid var(--jh-border);
          background: white;

          color: #667789;
          font-size: 11px;
          line-height: 1.6;
          text-align: center;
        }

        .jh-disclaimer i {
          color: var(--jh-primary);
        }

        /* ==================================
           SIDEBAR
           ================================== */

        .jh-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .jh-side-card {
          padding: 19px;
          background: white;
          border: 1px solid var(--jh-border);
          border-radius: 15px;
        }

        .jh-side-card h3 {
          display: flex;
          align-items: center;
          gap: 11px;

          margin: 0 0 12px;

          color: var(--jh-text);
          font-size: 18px;
          font-weight: 800;
        }

        .jh-side-card h3 i {
          color: var(--jh-primary);
          font-size: 18px;
        }

        /* ==================================
           POPULAR QUESTIONS
           ================================== */

        .jh-popular-list {
          display: flex;
          flex-direction: column;
        }

        .jh-popular-list button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 11px;

          width: 100%;
          min-height: 47px;

          padding: 11px 7px;
          border: 0;
          border-bottom: 1px solid #e8eeeb;
          border-radius: 4px;

          background: transparent;
          color: #283b50;

          font-size: 14px;
          font-weight: 600;
          line-height: 1.5;
          text-align: left;

          cursor: pointer;
        }

        .jh-popular-list button:last-child {
          border-bottom: 0;
        }

        .jh-popular-list button:hover {
          color: var(--jh-primary-dark);
          background: #edf8f1;
        }

        .jh-popular-text {
          min-width: 0;
          flex: 1;
          overflow-wrap: anywhere;
        }

        .jh-popular-list button > i {
          flex-shrink: 0;
          color: #7d9288;
          font-size: 12px;
        }

        .jh-popular-list button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        /* ==================================
           USEFUL SERVICES
           ================================== */

        .jh-service-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .jh-service-list a {
          display: flex;
          align-items: center;
          gap: 12px;

          min-height: 47px;
          padding: 10px 13px;

          border: 1px solid #e6ece8;
          border-radius: 10px;

          background: #f8faf9;
          color: #273d53;

          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }

        .jh-service-list a > i:first-child {
          flex-shrink: 0;
          width: 19px;
          color: var(--jh-primary);
        }

        .jh-service-list a > span {
          flex: 1;
          min-width: 0;
        }

        .jh-service-list a > i:last-child {
          flex-shrink: 0;
          color: #83958d;
          font-size: 11px;
        }

        .jh-service-list a:hover {
          background: #e8f5ed;
          border-color: #bcdcca;
          color: var(--jh-primary-dark);
        }

        /* ==================================
           SAFETY CARD
           ================================== */

        .jh-safety-card {
          padding: 19px;

          background: #f0f9f3;
          border: 1px solid #c5e1cd;
          border-radius: 15px;

          color: #285741;
        }

        .jh-safety-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .jh-safety-heading i {
          color: #147348;
          font-size: 20px;
        }

        .jh-safety-heading strong {
          font-size: 16px;
        }

        .jh-safety-card p {
          margin: 0;
          color: #3d6752;
          font-size: 13px;
          line-height: 1.75;
        }

        .jh-empty-small {
          margin: 0;
          color: var(--jh-muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .jh-side-error p {
          margin: 0 0 10px;
          color: #a43c3c;
          font-size: 13px;
        }

        .jh-side-error button,
        .jh-retry-button {
          padding: 9px 12px;
          border: 1px solid #b8d7c5;
          border-radius: 9px;

          background: #f2faf5;
          color: var(--jh-primary-dark);

          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        /* ==================================
           FAQ PANEL
           ================================== */

        .jh-faq-panel {
          padding: 25px;

          background: white;
          border: 1px solid var(--jh-border);
          border-radius: 16px;
        }

        .jh-faq-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        .jh-faq-heading h2 {
          margin: 0 0 7px;
          color: var(--jh-text);
          font-size: 23px;
          font-weight: 800;
        }

        .jh-faq-heading p {
          margin: 0;
          color: var(--jh-muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .jh-switch-chat {
          flex-shrink: 0;
          padding: 12px 16px;

          background: var(--jh-primary);
          border: 0;
          border-radius: 10px;

          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .jh-switch-chat:hover {
          background: var(--jh-primary-dark);
        }

        /* ==================================
           FAQ SEARCH
           ================================== */

        .jh-search {
          display: flex;
          align-items: center;
          gap: 11px;

          padding: 0 14px;
          margin-bottom: 20px;

          background: #fbfcfc;
          border: 1px solid var(--jh-border);
          border-radius: 11px;
        }

        .jh-search > i {
          color: var(--jh-primary);
        }

        .jh-search input {
          flex: 1;
          min-width: 0;

          padding: 14px 0;
          border: 0;

          background: transparent;
          color: var(--jh-text);

          font-size: 15px;
          outline: none;
        }

        .jh-search button {
          border: 0;
          background: transparent;
          color: var(--jh-muted);
          cursor: pointer;
        }

        /* ==================================
           FAQ CATEGORIES
           ================================== */

        .jh-category-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 23px;
        }

        .jh-category-button {
          padding: 9px 13px;

          background: #f8faf9;
          border: 1px solid var(--jh-border);
          border-radius: 9px;

          color: #34495e;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .jh-category-button.active {
          background: var(--jh-primary);
          border-color: var(--jh-primary);
          color: white;
        }

        .jh-category-button:hover:not(.active) {
          background: var(--jh-primary-light);
        }

        .jh-faq-results-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;

          padding-bottom: 13px;
          margin-bottom: 13px;
          border-bottom: 1px solid var(--jh-border);
        }

        .jh-faq-results-heading strong {
          font-size: 16px;
        }

        .jh-faq-results-heading span {
          color: var(--jh-muted);
          font-size: 12px;
        }

        /* ==================================
           FAQ ACCORDION
           ================================== */

        .jh-faq-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .jh-faq-item {
          overflow: hidden;
          border: 1px solid var(--jh-border);
          border-radius: 11px;
        }

        .jh-faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          width: 100%;
          padding: 16px;

          border: 0;
          background: white;
          color: var(--jh-text);

          font-size: 15px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
        }

        .jh-faq-question:hover {
          background: #f5faf7;
        }

        .jh-faq-question > span {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .jh-faq-question > span i {
          color: var(--jh-primary);
        }

        .jh-faq-question > i {
          color: #8795a4;
          font-size: 12px;
        }

        .jh-faq-answer {
          padding: 17px;

          border-top: 1px solid var(--jh-border);
          background: #fbfdfb;

          color: #364a5f;
          font-size: 15px;
          line-height: 1.8;
        }

        .jh-faq-answer p {
          margin: 0 0 10px;
          white-space: pre-wrap;
        }

        .jh-ask-faq {
          display: inline-flex;
          align-items: center;
          gap: 9px;

          margin-top: 12px;
          padding: 10px 13px;

          background: white;
          border: 1px solid #bfdcca;
          border-radius: 9px;

          color: var(--jh-primary-dark);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .jh-ask-faq:hover {
          background: var(--jh-primary-light);
        }

        /* ==================================
           EMPTY / ERROR STATE
           ================================== */

        .jh-empty-state {
          padding: 45px 15px;
          text-align: center;
        }

        .jh-empty-state > i {
          font-size: 35px;
          color: #a4b7ad;
          margin-bottom: 13px;
        }

        .jh-empty-state h3 {
          margin: 0 0 8px;
          color: var(--jh-text);
          font-size: 19px;
        }

        .jh-empty-state p {
          color: var(--jh-muted);
          font-size: 14px;
          margin: 0 0 16px;
        }

        .jh-empty-state button {
          border: 0;
          border-radius: 9px;
          padding: 11px 15px;

          background: var(--jh-primary);
          color: white;

          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .jh-faq-error {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 9px;
        }

        .jh-faq-footer {
          display: flex;
          align-items: flex-start;
          gap: 9px;

          margin-top: 23px;
          color: var(--jh-muted);

          font-size: 12px;
          line-height: 1.6;
        }

        .jh-faq-footer i {
          color: var(--jh-primary);
        }

        .jh-visually-hidden {
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

        /* ==================================
           LAPTOP
           ================================== */

        @media (max-width: 1200px) {
          .jh-layout {
            grid-template-columns:
              minmax(0, 1.6fr)
              minmax(260px, .8fr);

            gap: 16px;
          }

          .jh-quick-button,
          .jh-popular-list button,
          .jh-service-list a {
            font-size: 13px;
          }
        }

        /* ==================================
           TABLET
           ================================== */

        @media (max-width: 960px) {
          .jh-layout {
            grid-template-columns: 1fr;
          }

          .jh-messages {
            height: 400px;
          }

          .jh-sidebar {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .jh-safety-card {
            grid-column: 1 / -1;
          }
        }

        /* ==================================
           MOBILE
           ================================== */

        @media (max-width: 640px) {
          .jh-intro {
            align-items: flex-start;
            gap: 11px;
            padding: 15px;
          }

          .jh-intro-icon {
            width: 43px;
            height: 43px;
            font-size: 19px;
          }

          .jh-intro-text h2 {
            font-size: 18px;
          }

          .jh-intro-text p {
            font-size: 13px;
          }

          .jh-status {
            display: none;
          }

          .jh-tabs {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .jh-tab {
            padding: 12px 8px;
            font-size: 12px;
            gap: 6px;
          }

          .jh-chat-header {
            padding: 13px;
          }

          .jh-chat-title h3 {
            font-size: 15px;
          }

          .jh-chat-title p {
            font-size: 11px;
          }

          .jh-chat-avatar {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .jh-messages {
            height: 44dvh;
            min-height: 290px;
            max-height: 520px;
            padding: 15px 11px;
          }

          .jh-message-avatar {
            width: 30px;
            height: 30px;
            font-size: 14px;
          }

          .jh-message-body {
            max-width: 90%;
          }

          .jh-bubble {
            padding: 11px 12px;
            font-size: 14px;
          }

          .jh-quick-section {
            padding: 14px 12px;
          }

          .jh-quick-section h4 {
            font-size: 15px;
          }

          .jh-quick-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .jh-quick-button {
            min-height: 44px;
            padding: 10px 12px;
            font-size: 13px;
          }

          .jh-input-section {
            padding: 11px;
          }

          .jh-input-section input {
            padding: 12px;
            font-size: 16px;
          }

          .jh-input-section > button {
            width: 43px;
            height: 43px;
          }

          .jh-disclaimer {
            padding: 10px;
            font-size: 10px;
          }

          .jh-sidebar {
            display: flex;
            flex-direction: column;
          }

          .jh-side-card {
            padding: 16px;
          }

          .jh-side-card h3 {
            font-size: 17px;
          }

          .jh-faq-panel {
            padding: 15px;
          }

          .jh-faq-heading {
            flex-direction: column;
            gap: 13px;
          }

          .jh-faq-heading h2 {
            font-size: 20px;
          }

          .jh-faq-question {
            padding: 13px;
            font-size: 14px;
          }

          .jh-category-button {
            font-size: 12px;
            padding: 8px 10px;
          }
        }

        /* ==================================
           REDUCED MOTION
           ================================== */

        @media (prefers-reduced-motion: reduce) {
          .jh-root *,
          .jh-root *::before,
          .jh-root *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }

      `}</style>
    </>
  );
}
