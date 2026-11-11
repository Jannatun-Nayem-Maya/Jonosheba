
import 'dotenv/config';

import mongoose from 'mongoose';
import { createHash } from 'node:crypto';

import {
  HelpArticle
} from './models/HelpCenter.js';

// ==========================================
// JONOSEBA HELP CENTER DATABASE SEED
// ==========================================

// Run from backend folder:
// node seedHelpCenter.js
//
// This seed:
// 1. Adds bilingual FAQ articles.
// 2. Avoids creating duplicate seed records.
// 3. Preserves existing admin modifications.
// 4. Does not delete existing database content.
// 5. Does not use a paid AI service.

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/jonoseba_db';

// Date on which external government sources
// were checked for the initial seed content.
const VERIFIED_AT = new Date('2026-11-07');

// ==========================================
// OFFICIAL SOURCE URLS
// ==========================================

const SOURCES = {
  government: 'https://bangladesh.gov.bd/',
  police: 'https://www.police.gov.bd/en/hot_line_number',
  nid: 'https://services.nidw.gov.bd/nid-pub/',
  passport: 'https://www.epassport.gov.bd/',
  constitution:
    'https://bdlaws.minlaw.gov.bd/act-367/section-24551.html',
  nationalSymbols:
    'https://dubai.mofa.gov.bd/pages/static-pages/bangladesh-at-a-glance-f193b2-6952668f35ce18e1c05aa097',
  disaster: 'https://rapid.ddm.gov.bd/service/list'
};

// ==========================================
// HELP ARTICLE FACTORY
// ==========================================

function makeFAQ({
  key,
  category,
  questionBn,
  questionEn,
  answerBn,
  answerEn,
  keywordsBn = [],
  keywordsEn = [],
  alternativeQuestionsBn = [],
  alternativeQuestionsEn = [],
  sourceType = 'jonoseba',
  sourceUrl = '',
  serviceRoute = '',
  featured = false,
  sortOrder = 0
}) {
  return {
    key,
    question: {
      bn: questionBn,
      en: questionEn
    },
    answer: {
      bn: answerBn,
      en: answerEn
    },
    category,
    keywordsBn,
    keywordsEn,
    alternativeQuestionsBn,
    alternativeQuestionsEn,
    sourceType,
    sourceUrl,
    serviceRoute,
    featured,
    sortOrder,
    status: 'published',
    verifiedAt:
      sourceType === 'official'
        ? VERIFIED_AT
        : null
  };
}

// ==========================================
// INITIAL VERIFIED FAQ DATA
// ==========================================

const FAQ_DATA = [

  // ========================================
  // 1. JONOSEBA GENERAL QUESTIONS
  // ========================================

  makeFAQ({
    key: 'jonoseba-about',
    category: 'jonoseba',
    questionBn: 'জনসেবা কী?',
    questionEn: 'What is Jonoseba?',
    answerBn:
      'জনসেবা একটি নাগরিক সহায়তামূলক ওয়েব প্ল্যাটফর্ম। এখানে দুর্যোগ সতর্কতা, রক্তদাতা খোঁজা, বৃত্তির তথ্য, কল্যাণ কর্মসূচি, কাছাকাছি প্রয়োজনীয় সেবা এবং অভিযোগ ব্যবস্থাপনার মতো সুবিধা রয়েছে। এটি বাংলাদেশ সরকারের অফিসিয়াল পোর্টাল নয়।',
    answerEn:
      'Jonoseba is a citizen-support web platform. It provides access to disaster alerts, blood donor search, scholarship information, welfare programs, nearby essential services and complaint management. It is not an official Bangladesh government portal.',
    keywordsBn: [
      'জনসেবা',
      'জনসেবা কি',
      'ওয়েবসাইট',
      'পরিচিতি'
    ],
    keywordsEn: [
      'jonoseba',
      'about jonoseba',
      'website',
      'platform'
    ],
    alternativeQuestionsBn: [
      'জনসেবা ওয়েবসাইটে কী কী সেবা আছে?',
      'এই ওয়েবসাইটের কাজ কী?'
    ],
    alternativeQuestionsEn: [
      'What does Jonoseba do?',
      'What services does Jonoseba provide?'
    ],
    serviceRoute: '/services',
    featured: true,
    sortOrder: 1
  }),

  makeFAQ({
    key: 'jonoseba-register',
    category: 'jonoseba',
    questionBn: 'জনসেবায় অ্যাকাউন্ট কীভাবে তৈরি করব?',
    questionEn: 'How can I register on Jonoseba?',
    answerBn:
      'জনসেবা ওয়েবসাইটের Register পৃষ্ঠায় যান। প্রয়োজনীয় তথ্য দিয়ে ফর্ম পূরণ করুন, পাসওয়ার্ড ও Confirm Password মিলিয়ে দেখুন এবং নিবন্ধন সম্পন্ন করুন।',
    answerEn:
      'Open the Register page on Jonoseba. Complete the required fields, make sure your password and confirmation match, and submit the registration form.',
    keywordsBn: [
      'রেজিস্ট্রেশন',
      'অ্যাকাউন্ট',
      'নিবন্ধন',
      'সাইন আপ'
    ],
    keywordsEn: [
      'register',
      'registration',
      'signup',
      'create account'
    ],
    serviceRoute: '/register',
    featured: true,
    sortOrder: 2
  }),

  makeFAQ({
    key: 'jonoseba-login',
    category: 'jonoseba',
    questionBn: 'জনসেবায় লগইন কীভাবে করব?',
    questionEn: 'How do I log in to Jonoseba?',
    answerBn:
      'Login পৃষ্ঠায় গিয়ে আপনার নিবন্ধিত ইমেইল ও পাসওয়ার্ড লিখে লগইন করুন। অ্যাকাউন্ট ব্লক করা থাকলে Admin আনব্লক না করা পর্যন্ত লগইন করা যাবে না।',
    answerEn:
      'Open the Login page and enter your registered email address and password. If your account has been blocked, you cannot log in until an administrator unblocks it.',
    keywordsBn: [
      'লগইন',
      'সাইন ইন',
      'পাসওয়ার্ড',
      'ব্লক'
    ],
    keywordsEn: [
      'login',
      'sign in',
      'password',
      'blocked account'
    ],
    serviceRoute: '/login',
    sortOrder: 3
  }),

  makeFAQ({
    key: 'jonoseba-dashboard',
    category: 'jonoseba',
    questionBn: 'আমার ড্যাশবোর্ড কোথায় পাব?',
    questionEn: 'Where can I find my dashboard?',
    answerBn:
      'অ্যাকাউন্টে লগইন করার পর Citizen Dashboard থেকে নিজের আবেদন ও সংশ্লিষ্ট তথ্য দেখতে পারবেন। কিছু সুবিধা ব্যবহারের জন্য লগইন প্রয়োজন।',
    answerEn:
      'After logging in, open the Citizen Dashboard to view your applications and related information. Some features require authentication.',
    keywordsBn: [
      'ড্যাশবোর্ড',
      'আমার অ্যাকাউন্ট',
      'আমার আবেদন'
    ],
    keywordsEn: [
      'dashboard',
      'my account',
      'my applications'
    ],
    serviceRoute: '/dashboard',
    sortOrder: 4
  }),

  // ========================================
  // 2. RELIEF APPLICATION
  // ========================================

  makeFAQ({
    key: 'relief-apply',
    category: 'relief',
    questionBn: 'ত্রাণের জন্য কীভাবে আবেদন করব?',
    questionEn: 'How can I apply for disaster relief?',
    answerBn:
      'প্রথমে জনসেবায় লগইন করুন। এরপর Relief Application পৃষ্ঠায় গিয়ে প্রয়োজনীয় তথ্য দিন এবং প্রমাণ হিসেবে ছবি বা PDF আপলোড করুন। আবেদন জমা হলে Tracking ID ব্যবহার করে অগ্রগতি জানতে পারবেন।',
    answerEn:
      'Log in to Jonoseba and open the Relief Application page. Provide the required information and upload an evidence image or PDF. After submission, use the tracking ID to follow the application.',
    keywordsBn: [
      'ত্রাণ',
      'ত্রাণ আবেদন',
      'দুর্যোগ সহায়তা',
      'রিলিফ'
    ],
    keywordsEn: [
      'relief',
      'relief application',
      'disaster relief',
      'apply relief'
    ],
    alternativeQuestionsBn: [
      'আমি ত্রাণ পেতে চাই',
      'ত্রাণ আবেদন করার নিয়ম কী?'
    ],
    alternativeQuestionsEn: [
      'I want to apply for relief',
      'What is the relief application process?'
    ],
    serviceRoute: '/relief-apply',
    featured: true,
    sortOrder: 5
  }),

  makeFAQ({
    key: 'relief-evidence',
    category: 'relief',
    questionBn: 'ত্রাণের আবেদনে কী প্রমাণ আপলোড করতে হবে?',
    questionEn: 'What evidence is required for a relief application?',
    answerBn:
      'জনসেবার ত্রাণ আবেদন ফর্মে একটি প্রমাণ ফাইল আপলোড করতে হয়। বর্তমান ফর্মে JPG, PNG অথবা PDF ফাইল গ্রহণ করা হয় এবং সর্বোচ্চ ফাইল সাইজ ৫ MB। প্রাসঙ্গিক ও সত্য তথ্য ব্যবহার করুন।',
    answerEn:
      'Jonoseba requires an evidence file for a relief application. The current form accepts JPG, PNG or PDF files up to 5 MB. Submit relevant and accurate information.',
    keywordsBn: [
      'প্রমাণ',
      'ডকুমেন্ট',
      'ছবি',
      'পিডিএফ'
    ],
    keywordsEn: [
      'evidence',
      'document',
      'upload',
      'jpg',
      'pdf'
    ],
    serviceRoute: '/relief-apply',
    sortOrder: 6
  }),

  makeFAQ({
    key: 'application-tracking',
    category: 'relief',
    questionBn: 'আমার আবেদনের অবস্থা কীভাবে দেখব?',
    questionEn: 'How can I check my application status?',
    answerBn:
      'জনসেবায় লগইন করে Citizen Dashboard-এ যান। সেখানে নিজের আবেদনগুলোর Pending, Approved বা Rejected অবস্থা দেখতে পারবেন। আবেদন জমা দেওয়ার সময় পাওয়া Tracking ID সংরক্ষণ করুন।',
    answerEn:
      'Log in and open the Citizen Dashboard. You can review whether your applications are Pending, Approved or Rejected. Keep the tracking ID provided when you submit an application.',
    keywordsBn: [
      'আবেদনের অবস্থা',
      'ট্র্যাকিং',
      'অনুমোদন',
      'পেন্ডিং'
    ],
    keywordsEn: [
      'application status',
      'track application',
      'tracking id',
      'pending',
      'approved'
    ],
    serviceRoute: '/dashboard',
    featured: true,
    sortOrder: 7
  }),

  // ========================================
  // 3. BLOOD DONATION
  // ========================================

  makeFAQ({
    key: 'blood-find',
    category: 'blood',
    questionBn: 'রক্তদাতা কীভাবে খুঁজব?',
    questionEn: 'How can I find blood donors?',
    answerBn:
      'জনসেবার Blood Donors পৃষ্ঠায় যান। প্রয়োজনীয় রক্তের গ্রুপ ও অবস্থান অনুযায়ী রক্তদাতা খুঁজুন। যোগাযোগের আগে দাতার সম্মতি, বর্তমান উপলব্ধতা ও চিকিৎসাগত যোগ্যতা নিশ্চিত করুন।',
    answerEn:
      'Open the Blood Donors page on Jonoseba. Search by blood group and location. Before proceeding, confirm the donor’s consent, current availability and medical eligibility.',
    keywordsBn: [
      'রক্তদাতা',
      'রক্ত খুঁজব',
      'ব্লাড ডোনার',
      'রক্তের গ্রুপ'
    ],
    keywordsEn: [
      'blood donor',
      'blood donors',
      'find blood',
      'blood group'
    ],
    serviceRoute: '/blood-donors',
    featured: true,
    sortOrder: 8
  }),

  makeFAQ({
    key: 'blood-register',
    category: 'blood',
    questionBn: 'রক্তদাতা হিসেবে কীভাবে নিবন্ধন করব?',
    questionEn: 'How can I register as a blood donor?',
    answerBn:
      'Blood Donors পৃষ্ঠায় গিয়ে দাতা নিবন্ধনের ফর্ম ব্যবহার করুন। নাম, রক্তের গ্রুপ, যোগাযোগের তথ্য ও অবস্থানসহ প্রয়োজনীয় তথ্য দিন। দাতা হিসেবে তালিকাভুক্ত হওয়া চিকিৎসাগতভাবে রক্তদানের উপযুক্ত হওয়ার নিশ্চয়তা নয়।',
    answerEn:
      'Go to the Blood Donors page and use the donor registration form. Enter your name, blood group, contact details and location. Registration does not establish medical eligibility to donate blood.',
    keywordsBn: [
      'রক্তদাতা নিবন্ধন',
      'রক্তদান',
      'ডোনার রেজিস্ট্রেশন'
    ],
    keywordsEn: [
      'donor registration',
      'become donor',
      'register donor'
    ],
    serviceRoute: '/blood-donors',
    sortOrder: 9
  }),

  makeFAQ({
    key: 'blood-request',
    category: 'blood',
    questionBn: 'রক্তের জন্য অনুরোধ কীভাবে করব?',
    questionEn: 'How can I request blood?',
    answerBn:
      'জনসেবার Blood Donors বিভাগে রক্তের অনুরোধ করার সুবিধা ব্যবহার করুন। রোগীর নাম, প্রয়োজনীয় রক্তের গ্রুপ, হাসপাতাল, যোগাযোগের নম্বর এবং জরুরি অবস্থার তথ্য দিন। জরুরি চিকিৎসার ক্ষেত্রে হাসপাতালের সঙ্গে সরাসরি যোগাযোগ করুন।',
    answerEn:
      'Use the blood request feature in the Blood Donors section. Provide the patient name, required blood group, hospital, contact number and urgency. For a medical emergency, contact the hospital directly.',
    keywordsBn: [
      'রক্তের অনুরোধ',
      'রক্ত প্রয়োজন',
      'রক্ত লাগবে'
    ],
    keywordsEn: [
      'request blood',
      'need blood',
      'blood request'
    ],
    serviceRoute: '/blood-donors',
    sortOrder: 10
  }),

  // ========================================
  // 4. SCHOLARSHIPS
  // ========================================

  makeFAQ({
    key: 'scholarship-search',
    category: 'scholarship',
    questionBn: 'জনসেবায় বৃত্তির তথ্য কীভাবে পাব?',
    questionEn: 'How can I find scholarship information?',
    answerBn:
      'Scholarships পৃষ্ঠায় গিয়ে সরকারি, আন্তর্জাতিক ও বিশ্ববিদ্যালয়ভিত্তিক বৃত্তির তথ্য দেখতে পারবেন। প্রতিটি বৃত্তির যোগ্যতা, সুবিধা ও আবেদন করার শেষ তারিখ যাচাই করুন। সর্বশেষ নিয়মের জন্য প্রদানকারী প্রতিষ্ঠানের অফিসিয়াল ওয়েবসাইট দেখুন।',
    answerEn:
      'Open the Scholarships page to explore government, international and university scholarships. Check eligibility, benefits and application deadlines. Verify the latest rules on the provider’s official website.',
    keywordsBn: [
      'বৃত্তি',
      'স্কলারশিপ',
      'পড়াশোনা',
      'শিক্ষা'
    ],
    keywordsEn: [
      'scholarship',
      'scholarships',
      'education funding'
    ],
    serviceRoute: '/scholarship',
    sortOrder: 11
  }),

  // ========================================
  // 5. DISASTER AND SHELTER
  // ========================================

  makeFAQ({
    key: 'disaster-alerts',
    category: 'disaster',
    questionBn: 'দুর্যোগ সতর্কতা কোথায় দেখব?',
    questionEn: 'Where can I see disaster alerts?',
    answerBn:
      'জনসেবার Disaster Alerts পৃষ্ঠায় গিয়ে প্রকাশিত দুর্যোগ সতর্কতা দেখতে পারবেন। জরুরি সিদ্ধান্ত নেওয়ার আগে বাংলাদেশ আবহাওয়া অধিদপ্তর বা সংশ্লিষ্ট সরকারি কর্তৃপক্ষের সর্বশেষ তথ্যও যাচাই করুন।',
    answerEn:
      'Visit the Disaster Alerts page on Jonoseba to review published alerts. Before making emergency decisions, also verify the latest information from the Bangladesh Meteorological Department or other relevant authorities.',
    keywordsBn: [
      'দুর্যোগ',
      'সতর্কতা',
      'বন্যা',
      'ঘূর্ণিঝড়'
    ],
    keywordsEn: [
      'disaster',
      'warning',
      'flood',
      'cyclone',
      'alerts'
    ],
    serviceRoute: '/disaster-alerts',
    sortOrder: 12
  }),

  makeFAQ({
    key: 'shelter-information',
    category: 'disaster',
    questionBn: 'দুর্যোগের সময় আশ্রয়কেন্দ্র কোথায় খুঁজব?',
    questionEn: 'How can I find disaster shelters?',
    answerBn:
      'জনসেবার Disaster Alerts বিভাগে আশ্রয়কেন্দ্রের তথ্য দেখুন। সেখানে তালিকাভুক্ত অবস্থান ও যোগাযোগের তথ্য ব্যবহার করতে পারেন। যাওয়ার আগে স্থানীয় কর্তৃপক্ষের সঙ্গে কেন্দ্রটি খোলা আছে কি না নিশ্চিত করুন।',
    answerEn:
      'Check the shelter information in the Disaster Alerts section of Jonoseba. Use the listed locations and contacts. Confirm with local authorities that a shelter is operating before travelling.',
    keywordsBn: [
      'আশ্রয়কেন্দ্র',
      'আশ্রয়',
      'নিরাপদ স্থান',
      'শেল্টার'
    ],
    keywordsEn: [
      'shelter',
      'disaster shelter',
      'safe shelter'
    ],
    serviceRoute: '/disaster-alerts',
    sortOrder: 13
  }),

  // ========================================
  // 6. VOLUNTEER SERVICES
  // ========================================

  makeFAQ({
    key: 'volunteer-register',
    category: 'volunteer',
    questionBn: 'স্বেচ্ছাসেবক হিসেবে কীভাবে নিবন্ধন করব?',
    questionEn: 'How can I register as a volunteer?',
    answerBn:
      'জনসেবায় লগইন করে Volunteer পৃষ্ঠায় যান। আপনার নাম, ফোন নম্বর, কাজের এলাকা ও আগ্রহের বিষয়সহ প্রয়োজনীয় তথ্য দিয়ে স্বেচ্ছাসেবক নিবন্ধন সম্পন্ন করুন।',
    answerEn:
      'Log in to Jonoseba and open the Volunteer page. Complete the volunteer registration form with your name, phone number, area and interests.',
    keywordsBn: [
      'স্বেচ্ছাসেবক',
      'ভলান্টিয়ার',
      'নিবন্ধন'
    ],
    keywordsEn: [
      'volunteer',
      'volunteer registration',
      'volunteering'
    ],
    serviceRoute: '/volunteer',
    sortOrder: 14
  }),

  makeFAQ({
    key: 'volunteer-events',
    category: 'volunteer',
    questionBn: 'স্বেচ্ছাসেবক ইভেন্টে কীভাবে অংশগ্রহণ করব?',
    questionEn: 'How can I join a volunteer event?',
    answerBn:
      'Volunteer পৃষ্ঠায় উপলব্ধ ইভেন্টগুলো দেখুন। কোনো ইভেন্টে স্থান খালি থাকলে লগইন করে Join করার সুবিধা ব্যবহার করতে পারবেন।',
    answerEn:
      'View available events on the Volunteer page. If an event has available places, you can log in and use its Join feature.',
    keywordsBn: [
      'ইভেন্ট',
      'স্বেচ্ছাসেবক ইভেন্ট',
      'যোগদান'
    ],
    keywordsEn: [
      'volunteer event',
      'join event',
      'volunteer activities'
    ],
    serviceRoute: '/volunteer',
    sortOrder: 15
  }),

  // ========================================
  // 7. WELFARE PROGRAMS
  // ========================================

  makeFAQ({
    key: 'welfare-programs',
    category: 'welfare',
    questionBn: 'কল্যাণ কর্মসূচির তথ্য কোথায় পাব?',
    questionEn: 'Where can I find welfare programs?',
    answerBn:
      'Jonoseba-এর Welfare Programs পৃষ্ঠায় তালিকাভুক্ত কর্মসূচি, প্রযোজ্য যোগ্যতা ও ভাতার তথ্য দেখতে পারবেন। কোনো কর্মসূচিতে সরকারি আবেদন করতে হলে সংশ্লিষ্ট কর্তৃপক্ষের অফিসিয়াল নিয়ম অনুসরণ করুন।',
    answerEn:
      'Visit Jonoseba’s Welfare Programs page to review listed schemes, eligibility information and allowances. For official applications, follow the relevant government authority’s procedures.',
    keywordsBn: [
      'ভাতা',
      'কল্যাণ',
      'বয়স্ক ভাতা',
      'বিধবা ভাতা'
    ],
    keywordsEn: [
      'welfare',
      'allowance',
      'social benefits',
      'old age allowance'
    ],
    serviceRoute: '/welfare-programs',
    sortOrder: 16
  }),

  // ========================================
  // 8. COMPLAINT SYSTEM
  // ========================================

  makeFAQ({
    key: 'complaint-submit',
    category: 'complaint',
    questionBn: 'জনসেবায় অভিযোগ কীভাবে করব?',
    questionEn: 'How can I submit a complaint on Jonoseba?',
    answerBn:
      'Complaints পৃষ্ঠায় যান। অভিযোগের ধরন নির্বাচন করে প্রয়োজনীয় বিবরণ জমা দিন। আবেদন জমা দেওয়ার সময় লগইন প্রয়োজন হতে পারে। এটি জনসেবা প্ল্যাটফর্মের অভিযোগ ব্যবস্থা; সরকারি অভিযোগ প্রতিকার ব্যবস্থার বিকল্প নয়।',
    answerEn:
      'Open the Complaints page, choose the issue category and submit the relevant details. Submission may require login. This is Jonoseba’s complaint system and does not replace the government grievance redress system.',
    keywordsBn: [
      'অভিযোগ',
      'সমস্যা',
      'কমপ্লেইন',
      'রিপোর্ট'
    ],
    keywordsEn: [
      'complaint',
      'complain',
      'report problem',
      'issue'
    ],
    serviceRoute: '/complaints',
    featured: true,
    sortOrder: 17
  }),

  makeFAQ({
    key: 'complaint-track',
    category: 'complaint',
    questionBn: 'অভিযোগের অগ্রগতি কীভাবে দেখব?',
    questionEn: 'How can I track my complaint?',
    answerBn:
      'Complaints পৃষ্ঠায় অভিযোগ ট্র্যাক করার সুবিধা ব্যবহার করুন। আপনার অভিযোগের Tracking ID বা সিস্টেমে নির্দেশিত শনাক্তকারী তথ্য প্রয়োজন হতে পারে।',
    answerEn:
      'Use the complaint tracking feature on the Complaints page. You may need the tracking ID or other identification information requested by the system.',
    keywordsBn: [
      'অভিযোগ ট্র্যাক',
      'অভিযোগের অবস্থা',
      'ট্র্যাকিং নম্বর'
    ],
    keywordsEn: [
      'track complaint',
      'complaint status',
      'complaint tracking'
    ],
    serviceRoute: '/complaints',
    sortOrder: 18
  }),

  // ========================================
  // 9. NEARBY ESSENTIAL SERVICES
  // ========================================

  makeFAQ({
    key: 'nearby-services',
    category: 'jonoseba',
    questionBn: 'আমার কাছাকাছি হাসপাতাল বা ফার্মেসি কীভাবে খুঁজব?',
    questionEn: 'How can I find nearby hospitals or pharmacies?',
    answerBn:
      'Nearby Essential Services পৃষ্ঠায় যান। Location permission দিন অথবা উপলব্ধ location selection ব্যবহার করুন। এরপর Hospital, Pharmacy বা প্রয়োজনীয় সেবার ধরন নির্বাচন করে মানচিত্রে ফলাফল দেখুন।',
    answerEn:
      'Open Nearby Essential Services. Allow location access or choose an available location option. Select Hospital, Pharmacy or another service type to view available results on the map.',
    keywordsBn: [
      'হাসপাতাল',
      'ফার্মেসি',
      'কাছাকাছি',
      'ম্যাপ',
      'লোকেশন'
    ],
    keywordsEn: [
      'nearby',
      'hospital',
      'pharmacy',
      'map',
      'location'
    ],
    serviceRoute: '/nearby-services',
    featured: true,
    sortOrder: 19
  }),

  // ========================================
  // 10. GOVERNMENT E-SERVICES
  // ========================================

  makeFAQ({
    key: 'jonoseba-gov-services',
    category: 'government',
    questionBn: 'জনসেবায় সরকারি ই-সেবার লিংক কোথায় পাব?',
    questionEn: 'Where can I find government e-service links?',
    answerBn:
      'জনসেবার Government E-Services বিভাগে সরকারি সেবার লিংক ও নির্দেশনা দেখতে পারবেন। প্রকৃত সরকারি আবেদন করার সময় সংশ্লিষ্ট সরকারি ওয়েবসাইট ব্যবহার করুন।',
    answerEn:
      'Open Jonoseba’s Government E-Services section to find government service links and guidance. Use the relevant official government website when submitting an official application.',
    keywordsBn: [
      'সরকারি সেবা',
      'ই সেবা',
      'সরকারি লিংক'
    ],
    keywordsEn: [
      'government services',
      'e services',
      'government links'
    ],
    serviceRoute: '/gov-services',
    sortOrder: 20
  }),

  makeFAQ({
    key: 'nid-correction',
    category: 'government',
    questionBn: 'জাতীয় পরিচয়পত্র বা NID সংশোধন কোথায় করব?',
    questionEn: 'Where can I apply for NID correction?',
    answerBn:
      'জাতীয় পরিচয়পত্র সংশোধনের জন্য বাংলাদেশ নির্বাচন কমিশনের NID অনলাইন সেবা পোর্টাল ব্যবহার করুন। সেখানে অ্যাকাউন্টে প্রবেশ করে সংশোধন বা পুনঃইস্যু সংক্রান্ত সেবা পাওয়া যায়। প্রয়োজনীয় কাগজপত্র ও বর্তমান ফি অফিসিয়াল পোর্টালে যাচাই করুন।',
    answerEn:
      'Use the Bangladesh Election Commission NID online portal for correction and reissue services. Sign in to your account and follow the official instructions. Check the required documents and current fees on the portal.',
    keywordsBn: [
      'এনআইডি',
      'জাতীয় পরিচয়পত্র',
      'এনআইডি সংশোধন',
      'ভোটার আইডি'
    ],
    keywordsEn: [
      'nid',
      'nid correction',
      'national id',
      'voter id'
    ],
    alternativeQuestionsBn: [
      'ভোটার আইডি কার্ড সংশোধন করব কীভাবে?'
    ],
    alternativeQuestionsEn: [
      'How do I correct my national ID card?'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.nid,
    serviceRoute: '/gov-services',
    featured: true,
    sortOrder: 21
  }),

  makeFAQ({
    key: 'passport-apply',
    category: 'government',
    questionBn: 'বাংলাদেশে ই-পাসপোর্টের জন্য কোথায় আবেদন করব?',
    questionEn: 'Where can I apply for an e-passport in Bangladesh?',
    answerBn:
      'বাংলাদেশের অফিসিয়াল ই-পাসপোর্ট পোর্টাল www.epassport.gov.bd ব্যবহার করুন। সেখানে নতুন পাসপোর্ট বা পুনঃইস্যুর আবেদন, প্রয়োজনীয় নির্দেশনা এবং ফি সংক্রান্ত তথ্য রয়েছে।',
    answerEn:
      'Use the official Bangladesh e-passport portal at www.epassport.gov.bd. It provides new passport and reissue applications, instructions and fee information.',
    keywordsBn: [
      'পাসপোর্ট',
      'ই পাসপোর্ট',
      'পাসপোর্ট আবেদন'
    ],
    keywordsEn: [
      'passport',
      'e passport',
      'passport application',
      'passport renewal'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.passport,
    serviceRoute: '/gov-services',
    sortOrder: 22
  }),

  // ========================================
  // 11. BANGLADESH EMERGENCY SERVICES
  // ========================================

  makeFAQ({
    key: 'emergency-999',
    category: 'emergency',
    questionBn: 'বাংলাদেশের জাতীয় জরুরি সেবা নম্বর কত?',
    questionEn: 'What is the national emergency number of Bangladesh?',
    answerBn:
      'বাংলাদেশের জাতীয় জরুরি সেবা নম্বর ৯৯৯। জরুরি পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স সহায়তার জন্য এই নম্বরে কল করা যায়।',
    answerEn:
      'The national emergency number of Bangladesh is 999. It can be used to request emergency police, fire service and ambulance assistance.',
    keywordsBn: [
      '৯৯৯',
      'জরুরি নম্বর',
      'পুলিশ',
      'অ্যাম্বুলেন্স',
      'ফায়ার সার্ভিস'
    ],
    keywordsEn: [
      '999',
      'emergency number',
      'police emergency',
      'ambulance',
      'fire service'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.police,
    serviceRoute: '/emergency-contacts',
    featured: true,
    sortOrder: 23
  }),

  makeFAQ({
    key: 'government-333',
    category: 'emergency',
    questionBn: 'বাংলাদেশে ৩৩৩ নম্বরটি কীসের জন্য?',
    questionEn: 'What is the 333 helpline in Bangladesh?',
    answerBn:
      '৩৩৩ বাংলাদেশের সরকারি তথ্য ও নাগরিক সেবা সম্পর্কিত হেল্পলাইন। সরকারি সেবার তথ্য ও নির্দেশনা জানতে এই নম্বর ব্যবহার করা যায়।',
    answerEn:
      '333 is a government information and citizen service helpline in Bangladesh. It provides information and guidance about public services.',
    keywordsBn: [
      '৩৩৩',
      'সরকারি তথ্য',
      'নাগরিক সেবা'
    ],
    keywordsEn: [
      '333',
      'government information',
      'citizen helpline'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.government,
    serviceRoute: '/emergency-contacts',
    sortOrder: 24
  }),

  makeFAQ({
    key: 'child-1098',
    category: 'emergency',
    questionBn: 'বাংলাদেশে শিশু সহায়তার হেল্পলাইন কত?',
    questionEn: 'What is the child helpline number in Bangladesh?',
    answerBn:
      'বাংলাদেশে শিশু সহায়তার হেল্পলাইন নম্বর ১০৯৮। শিশু সুরক্ষা ও সহায়তা সংক্রান্ত প্রয়োজনে এই নম্বর ব্যবহার করা যায়।',
    answerEn:
      'The child helpline number in Bangladesh is 1098. It is used for child protection and assistance.',
    keywordsBn: [
      'শিশু সহায়তা',
      '১০৯৮',
      'শিশু হেল্পলাইন'
    ],
    keywordsEn: [
      '1098',
      'child helpline',
      'child protection'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.police,
    serviceRoute: '/emergency-contacts',
    sortOrder: 25
  }),

  makeFAQ({
    key: 'women-109',
    category: 'emergency',
    questionBn: 'বাংলাদেশে নারী ও শিশু নির্যাতন প্রতিরোধের হেল্পলাইন কত?',
    questionEn: 'What is the helpline for violence against women and children?',
    answerBn:
      'বাংলাদেশে নারী ও শিশু নির্যাতন প্রতিরোধে সহায়তার হেল্পলাইন নম্বর ১০৯। তাৎক্ষণিক বিপদে জাতীয় জরুরি সেবা ৯৯৯-এও যোগাযোগ করা যায়।',
    answerEn:
      'The helpline for assistance concerning violence against women and children in Bangladesh is 109. For an immediate emergency, 999 is also available.',
    keywordsBn: [
      'নারী সহায়তা',
      'নারী নির্যাতন',
      '১০৯',
      'শিশু নির্যাতন'
    ],
    keywordsEn: [
      '109',
      'women helpline',
      'violence against women',
      'domestic violence'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.police,
    serviceRoute: '/emergency-contacts',
    sortOrder: 26
  }),

  makeFAQ({
    key: 'disaster-1090',
    category: 'emergency',
    questionBn: 'বাংলাদেশে দুর্যোগের আগাম বার্তার নম্বর কত?',
    questionEn: 'What is the disaster early warning helpline in Bangladesh?',
    answerBn:
      'বাংলাদেশে দুর্যোগের আগাম বার্তা ও সংশ্লিষ্ট তথ্যের জন্য ১০৯০ হেল্পলাইন ব্যবহার করা হয়। জরুরি বিপদে ৯৯৯-এ যোগাযোগ করুন।',
    answerEn:
      'Bangladesh uses the 1090 helpline for disaster early warning and related information. For an immediate emergency, contact 999.',
    keywordsBn: [
      'দুর্যোগের আগাম বার্তা',
      '১০৯০',
      'বন্যা সতর্কতা'
    ],
    keywordsEn: [
      '1090',
      'disaster warning helpline',
      'early warning'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.disaster,
    serviceRoute: '/emergency-contacts',
    sortOrder: 27
  }),

  // ========================================
  // 12. BANGLADESH GENERAL KNOWLEDGE
  // ========================================

  makeFAQ({
    key: 'bangladesh-capital',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের রাজধানীর নাম কী?',
    questionEn: 'What is the capital of Bangladesh?',
    answerBn:
      'বাংলাদেশের রাজধানী ঢাকা।',
    answerEn:
      'The capital of Bangladesh is Dhaka.',
    keywordsBn: [
      'রাজধানী',
      'ঢাকা'
    ],
    keywordsEn: [
      'capital',
      'dhaka'
    ],
    sourceType: 'verified_knowledge',
    featured: true,
    sortOrder: 28
  }),

  makeFAQ({
    key: 'bangladesh-flower',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের জাতীয় ফুল কী?',
    questionEn: 'What is the national flower of Bangladesh?',
    answerBn:
      'বাংলাদেশের জাতীয় ফুল শাপলা।',
    answerEn:
      'The national flower of Bangladesh is the water lily (Shapla).',
    keywordsBn: [
      'জাতীয় ফুল',
      'শাপলা'
    ],
    keywordsEn: [
      'national flower',
      'water lily',
      'shapla'
    ],
    alternativeQuestionsBn: [
      'বাংলাদেশের জাতীয় ফুলের নাম কী?'
    ],
    alternativeQuestionsEn: [
      'Name the national flower of Bangladesh.'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.nationalSymbols,
    featured: true,
    sortOrder: 29
  }),

  makeFAQ({
    key: 'bangladesh-fruit',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের জাতীয় ফল কী?',
    questionEn: 'What is the national fruit of Bangladesh?',
    answerBn:
      'বাংলাদেশের জাতীয় ফল কাঁঠাল।',
    answerEn:
      'The national fruit of Bangladesh is jackfruit.',
    keywordsBn: [
      'জাতীয় ফল',
      'কাঁঠাল'
    ],
    keywordsEn: [
      'national fruit',
      'jackfruit'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.nationalSymbols,
    sortOrder: 30
  }),

  makeFAQ({
    key: 'bangladesh-fish',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের জাতীয় মাছ কী?',
    questionEn: 'What is the national fish of Bangladesh?',
    answerBn:
      'বাংলাদেশের জাতীয় মাছ ইলিশ।',
    answerEn:
      'The national fish of Bangladesh is Hilsa.',
    keywordsBn: [
      'জাতীয় মাছ',
      'ইলিশ'
    ],
    keywordsEn: [
      'national fish',
      'hilsa'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.nationalSymbols,
    sortOrder: 31
  }),

  makeFAQ({
    key: 'bangladesh-bird',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের জাতীয় পাখি কী?',
    questionEn: 'What is the national bird of Bangladesh?',
    answerBn:
      'বাংলাদেশের জাতীয় পাখি দোয়েল।',
    answerEn:
      'The national bird of Bangladesh is the Oriental magpie-robin (Doyel).',
    keywordsBn: [
      'জাতীয় পাখি',
      'দোয়েল'
    ],
    keywordsEn: [
      'national bird',
      'magpie robin',
      'doyel'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.nationalSymbols,
    sortOrder: 32
  }),

  makeFAQ({
    key: 'bangladesh-animal',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের জাতীয় পশু কী?',
    questionEn: 'What is the national animal of Bangladesh?',
    answerBn:
      'বাংলাদেশের জাতীয় পশু রয়েল বেঙ্গল টাইগার।',
    answerEn:
      'The national animal of Bangladesh is the Royal Bengal Tiger.',
    keywordsBn: [
      'জাতীয় পশু',
      'বাঘ',
      'রয়েল বেঙ্গল'
    ],
    keywordsEn: [
      'national animal',
      'royal bengal tiger'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.nationalSymbols,
    sortOrder: 33
  }),

  makeFAQ({
    key: 'bangladesh-anthem',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের জাতীয় সংগীত কী?',
    questionEn: 'What is the national anthem of Bangladesh?',
    answerBn:
      'বাংলাদেশের জাতীয় সংগীত রবীন্দ্রনাথ ঠাকুরের “আমার সোনার বাংলা” গানের প্রথম দশ চরণ।',
    answerEn:
      'The national anthem of Bangladesh consists of the first ten lines of “Amar Sonar Bangla” by Rabindranath Tagore.',
    keywordsBn: [
      'জাতীয় সংগীত',
      'আমার সোনার বাংলা'
    ],
    keywordsEn: [
      'national anthem',
      'amar sonar bangla'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.constitution,
    sortOrder: 34
  }),

  makeFAQ({
    key: 'bangladesh-flag',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের জাতীয় পতাকার রং কী?',
    questionEn: 'What are the colours of the Bangladesh national flag?',
    answerBn:
      'বাংলাদেশের জাতীয় পতাকায় সবুজ পটভূমির ওপর একটি লাল বৃত্ত রয়েছে।',
    answerEn:
      'The national flag of Bangladesh has a red circle on a green background.',
    keywordsBn: [
      'জাতীয় পতাকা',
      'পতাকার রং',
      'সবুজ লাল'
    ],
    keywordsEn: [
      'national flag',
      'flag colours',
      'red green'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.constitution,
    sortOrder: 35
  }),

  makeFAQ({
    key: 'bangladesh-language',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের রাষ্ট্রভাষা কী?',
    questionEn: 'What is the state language of Bangladesh?',
    answerBn:
      'বাংলাদেশের রাষ্ট্রভাষা বাংলা।',
    answerEn:
      'The state language of Bangladesh is Bangla.',
    keywordsBn: [
      'রাষ্ট্রভাষা',
      'বাংলা ভাষা'
    ],
    keywordsEn: [
      'state language',
      'bangla language'
    ],
    sourceType: 'verified_knowledge',
    sortOrder: 36
  }),

  makeFAQ({
    key: 'bangladesh-independence',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের স্বাধীনতা দিবস কবে?',
    questionEn: 'When is the Independence Day of Bangladesh?',
    answerBn:
      'বাংলাদেশের স্বাধীনতা দিবস ২৬ মার্চ।',
    answerEn:
      'The Independence Day of Bangladesh is observed on 26 March.',
    keywordsBn: [
      'স্বাধীনতা দিবস',
      '২৬ মার্চ'
    ],
    keywordsEn: [
      'independence day',
      '26 march'
    ],
    sourceType: 'verified_knowledge',
    sortOrder: 37
  }),

  makeFAQ({
    key: 'bangladesh-victory',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের বিজয় দিবস কবে?',
    questionEn: 'When is the Victory Day of Bangladesh?',
    answerBn:
      'বাংলাদেশের বিজয় দিবস ১৬ ডিসেম্বর।',
    answerEn:
      'Victory Day in Bangladesh is observed on 16 December.',
    keywordsBn: [
      'বিজয় দিবস',
      '১৬ ডিসেম্বর'
    ],
    keywordsEn: [
      'victory day',
      '16 december'
    ],
    sourceType: 'verified_knowledge',
    sortOrder: 38
  }),

  makeFAQ({
    key: 'bangladesh-currency',
    category: 'bangladesh',
    questionBn: 'বাংলাদেশের মুদ্রার নাম কী?',
    questionEn: 'What is the currency of Bangladesh?',
    answerBn:
      'বাংলাদেশের মুদ্রার নাম টাকা। আন্তর্জাতিক মুদ্রা কোড BDT।',
    answerEn:
      'The currency of Bangladesh is the Bangladeshi Taka, with ISO currency code BDT.',
    keywordsBn: [
      'মুদ্রা',
      'টাকা',
      'বিডিটি'
    ],
    keywordsEn: [
      'currency',
      'taka',
      'bdt'
    ],
    sourceType: 'verified_knowledge',
    sortOrder: 39
  }),

  makeFAQ({
    key: 'bangladesh-official-portal',
    category: 'government',
    questionBn: 'বাংলাদেশের সরকারি জাতীয় তথ্য বাতায়ন কোনটি?',
    questionEn: 'What is the official national portal of Bangladesh?',
    answerBn:
      'বাংলাদেশের জাতীয় তথ্য বাতায়ন হলো bangladesh.gov.bd। বিভিন্ন সরকারি প্রতিষ্ঠান ও সেবার তথ্য এই পোর্টালে পাওয়া যায়।',
    answerEn:
      'The Bangladesh National Portal is bangladesh.gov.bd. It provides access to information about government institutions and public services.',
    keywordsBn: [
      'জাতীয় তথ্য বাতায়ন',
      'সরকারি ওয়েবসাইট',
      'বাংলাদেশ পোর্টাল'
    ],
    keywordsEn: [
      'bangladesh national portal',
      'official government website',
      'bangladesh.gov.bd'
    ],
    sourceType: 'official',
    sourceUrl: SOURCES.government,
    sortOrder: 40
  })
];

// ==========================================
// STABLE SEED DOCUMENT ID
// ==========================================

// The same FAQ keeps the same database ID,
// even if an admin edits its question text.
//
// This is why repeated seeding cannot create
// another copy of the same seed FAQ.

function getSeedId(key) {
  const hex = createHash('sha256')
    .update(`jonoseba-help-center-v1:${key}`)
    .digest('hex')
    .slice(0, 24);

  return new mongoose.Types.ObjectId(hex);
}

// ==========================================
// VALIDATE INITIAL FAQ DATA
// ==========================================

function validateSeedData() {
  const keys = new Set();

  for (const faq of FAQ_DATA) {
    if (!faq.key || keys.has(faq.key)) {
      throw new Error(
        `Missing or duplicate FAQ key: ${faq.key}`
      );
    }

    keys.add(faq.key);

    if (
      !faq.question.bn ||
      !faq.question.en ||
      !faq.answer.bn ||
      !faq.answer.en
    ) {
      throw new Error(
        `Both languages are required: ${faq.key}`
      );
    }

    if (
      faq.sourceType === 'official' &&
      !faq.sourceUrl
    ) {
      throw new Error(
        `Official source URL is missing: ${faq.key}`
      );
    }
  }
}

// ==========================================
// DATABASE SEED OPERATION
// ==========================================

async function seedHelpCenter() {
  validateSeedData();

  console.log('Connecting to MongoDB...');

  await mongoose.connect(MONGO_URI);

  console.log('MongoDB connected successfully.');
  console.log('Starting Jonoseba Help Center seed...');

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const faq of FAQ_DATA) {
    const { key, ...articleData } = faq;

    const _id = getSeedId(key);

    try {
      // Existing seed articles are never overwritten.
      const existing = await HelpArticle.exists({
        _id
      });

      if (existing) {
        skipped += 1;
        console.log(`SKIP: ${key}`);
        continue;
      }

      const article = new HelpArticle({
        _id,
        ...articleData,
        createdBy: null,
        updatedBy: null,
        viewCount: 0
      });

      // Full Mongoose validation is executed here.
      await article.save();

      inserted += 1;
      console.log(`ADDED: ${key}`);

    } catch (error) {
      if (error.code === 11000) {
        skipped += 1;
        console.log(
          `SKIP (already exists): ${key}`
        );
        continue;
      }

      failed += 1;

      console.error(
        `FAILED: ${key}`,
        error.message
      );
    }
  }

  const publishedCount =
    await HelpArticle.countDocuments({
      status: 'published'
    });

  const featuredCount =
    await HelpArticle.countDocuments({
      status: 'published',
      featured: true
    });

  console.log('\n================================');
  console.log('JONOSEBA HELP CENTER SEED RESULT');
  console.log('================================');
  console.log(`Seed definitions: ${FAQ_DATA.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Already present: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total published: ${publishedCount}`);
  console.log(`Total featured: ${featuredCount}`);
  console.log('================================\n');

  if (failed > 0) {
    throw new Error(
      `${failed} FAQ articles could not be inserted.`
    );
  }

  console.log(
    'Help Center seed completed successfully.'
  );
}

// ==========================================
// RUN SEED
// ==========================================

try {
  await seedHelpCenter();
} catch (error) {
  console.error(
    'Help Center seed failed:',
    error.message
  );

  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
