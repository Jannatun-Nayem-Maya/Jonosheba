
import 'dotenv/config';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';

import GovService from './models/GovService.js';

const oldRecords = JSON.parse(
  await readFile(
    new URL(
      './data/govServices.seed.json',
      import.meta.url
    ),
    'utf8'
  )
);

const discontinuedSlugs = [
  'brta-fee',
  'learner-licence'
];

const replacements = [
  {
    slug: 'utility-bill-payment',
    category: 'utility',

    titleBn: 'অনলাইন ইউটিলিটি বিল পেমেন্ট',
    titleEn: 'Utility Bill Payment (ekPay)',

    summaryBn:
      'ekPay-এর মাধ্যমে সমর্থিত বিদ্যুৎ, পানি, গ্যাস এবং অন্যান্য ইউটিলিটি বিল পরিশোধের সেবায় প্রবেশ করুন।',

    summaryEn:
      'Access ekPay to pay supported electricity, water, gas and other utility bills.',

    officialUrl: 'https://ekpay.gov.bd/',

    stepsBn: [
      'সরকারি ekPay ওয়েবসাইট খুলুন।',
      'উপলব্ধ বিল বা ইউটিলিটি সেবা নির্বাচন করুন।',
      'সংশ্লিষ্ট বিল প্রদানকারী প্রতিষ্ঠান নির্বাচন করুন।',
      'প্রয়োজনীয় Customer ID, Bill ID বা Account Number দিন।',
      'বিলের তথ্য ও টাকার পরিমাণ যাচাই করুন।',
      'পোর্টালে প্রদর্শিত পেমেন্ট পদ্ধতি অনুসরণ করুন।'
    ],

    stepsEn: [
      'Open the official ekPay website.',
      'Choose an available bill or utility service.',
      'Select the relevant billing organization.',
      'Enter the requested Customer ID, Bill ID or Account Number.',
      'Review the bill details and amount.',
      'Complete payment using the available official payment options.'
    ],

    documentsBn: [
      'সংশ্লিষ্ট ইউটিলিটি বিলের তথ্য',
      'Customer ID, Bill ID অথবা Account Number',
      'প্রযোজ্য পেমেন্ট মাধ্যম'
    ],

    documentsEn: [
      'Relevant utility bill details',
      'Customer ID, Bill ID or Account Number',
      'An accepted payment method'
    ],

    published: true,

    sourceVerifiedAt: new Date(
      '2026-11-03T00:00:00.000Z'
    )
  },

  {
    slug: 'government-jobs',
    category: 'jobs',

    titleBn: 'সরকারি চাকরি ও নিয়োগ বিজ্ঞপ্তি',
    titleEn: 'Government Jobs & Circulars',

    summaryBn:
      'জাতীয় জব পোর্টালে সরকারি চাকরির বিজ্ঞপ্তি, চাকরি অনুসন্ধান এবং প্রযোজ্য আবেদন প্রক্রিয়ার তথ্য দেখুন।',

    summaryEn:
      'Explore government job opportunities, recruitment notices and application guidance through the National Job Portal.',

    officialUrl: 'https://sqtc.jobs.gov.bd/',

    stepsBn: [
      'জাতীয় জব পোর্টাল খুলুন।',
      'চাকরির তালিকা বা Find Jobs বিভাগে যান।',
      'প্রকাশিত বিজ্ঞপ্তির যোগ্যতা, শর্ত ও শেষ তারিখ যাচাই করুন।',
      'আবেদন উপলব্ধ থাকলে পোর্টালের নির্দেশনা অনুযায়ী নিবন্ধন বা লগইন করুন।',
      'প্রয়োজনীয় তথ্য দিয়ে আবেদন সম্পন্ন করুন।',
      'প্রযোজ্য ক্ষেত্রে আবেদন নিশ্চিতকরণ ও প্রবেশপত্রের তথ্য সংরক্ষণ করুন।'
    ],

    stepsEn: [
      'Open the National Job Portal.',
      'Go to Find Jobs or the job listings section.',
      'Review each notice, eligibility requirements and application deadline.',
      'If applications are available, register or sign in as instructed.',
      'Provide the requested information to complete the application.',
      'Save the application confirmation and admit-card details when applicable.'
    ],

    documentsBn: [
      'প্রযোজ্য শিক্ষাগত যোগ্যতার তথ্য',
      'আবেদনকারীর পরিচয় ও যোগাযোগের তথ্য',
      'নিয়োগ বিজ্ঞপ্তিতে উল্লেখিত অতিরিক্ত কাগজপত্র'
    ],

    documentsEn: [
      'Applicable educational qualification details',
      'Applicant identity and contact details',
      'Any additional documents specified in the recruitment notice'
    ],

    published: true,

    sourceVerifiedAt: new Date(
      '2026-11-03T00:00:00.000Z'
    )
  }
];

async function main() {
  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/jonoseba_db';

  try {
    await mongoose.connect(mongoUri);

    console.log('MongoDB connected.');

    // Keep all original services except the two
    // discontinued BRTA services.

    const retainedRecords = oldRecords.filter(
      (record) =>
        !discontinuedSlugs.includes(record.slug)
    );

    let existingAdded = 0;

    for (const record of retainedRecords) {
      const result = await GovService.updateOne(
        { slug: record.slug },
        {
          $setOnInsert: record
        },
        {
          upsert: true,
          runValidators: true
        }
      );

      if (result.upsertedCount > 0) {
        existingAdded++;
      }
    }

    // Add the new services without overwriting
    // later changes made by administrators.

    let replacementAdded = 0;

    for (const record of replacements) {
      const result = await GovService.updateOne(
        { slug: record.slug },
        {
          $setOnInsert: record
        },
        {
          upsert: true,
          runValidators: true
        }
      );

      if (result.upsertedCount > 0) {
        replacementAdded++;
      }

      console.log(`Ready: ${record.titleEn}`);
    }

    // Delete only the two explicitly replaced services.

    const deletion = await GovService.deleteMany({
      slug: {
        $in: discontinuedSlugs
      }
    });

    const total = await GovService.countDocuments();

    const published =
      await GovService.countDocuments({
        published: true
      });

    console.log('');
    console.log('Government E-Services updated successfully.');
    console.log(`Original services inserted: ${existingAdded}`);
    console.log(`New replacements inserted: ${replacementAdded}`);
    console.log(`Old BRTA services removed: ${deletion.deletedCount}`);
    console.log(`Total services: ${total}`);
    console.log(`Published services: ${published}`);
    console.log('');
    console.log('Existing unrelated records preserved.');
  } catch (error) {
    console.error(
      'Government E-Services seeding failed:',
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await main();
