/**
 * Languages an instructor can choose on the application form
 * (/instructors/apply).
 *
 * The API has no fixed list. POST /v1/instructors/apply accepts 1–20 strings of
 * up to 60 characters and runs each through `normalizeLanguageName`
 * (backend/src/modules/_languages.ts in the app repo): collapse whitespace,
 * upper-case any word of three letters or fewer, title-case every other word.
 * Learner discovery matches instructors on that normalised form, and learners
 * pick their languages from the app's onboarding list (`OB.langs` in
 * src/native/v2/data.js). So this list is:
 *
 *   1. every learner-list name, spelled exactly as the app spells it, so an
 *      instructor can always match a learner who picks it; plus
 *   2. other languages widely spoken in Great Britain, each written so the
 *      normaliser leaves it unchanged (no short words, brackets or hyphens),
 *      meaning the name an applicant picks is the name that is stored.
 *
 * "Farsi (Persian)" is the one exception to (2): the normaliser stores it as
 * "Farsi (persian)". It is kept verbatim because the learner list sends the
 * same string, so both sides normalise to the same value and still match.
 *
 * Keep (1) in sync with the app when its learner list changes. `aliases` only
 * widen search (typing "BSL" finds British Sign Language); they are never
 * submitted.
 */

export type InstructorLanguage = {
  /** Exactly what is submitted in `languages[]`. */
  name: string;
  /** Other names people search by. Never submitted. */
  aliases?: readonly string[];
};

/** Pre-selected on the form; most applicants teach in it. */
export const defaultInstructorLanguage = 'English';

/** English first, then alphabetical. */
export const instructorLanguages: readonly InstructorLanguage[] = [
  { name: 'English' },
  { name: 'Afrikaans' },
  { name: 'Akan', aliases: ['Twi', 'Fante'] },
  { name: 'Albanian', aliases: ['Shqip'] },
  { name: 'Amharic' },
  { name: 'Arabic' },
  { name: 'Bengali', aliases: ['Bangla'] },
  { name: 'Bosnian' },
  { name: 'British Sign Language', aliases: ['BSL', 'Sign language'] },
  { name: 'Bulgarian' },
  { name: 'Cantonese', aliases: ['Chinese', 'Yue'] },
  { name: 'Croatian' },
  { name: 'Czech' },
  { name: 'Danish' },
  { name: 'Dari', aliases: ['Afghan Persian'] },
  { name: 'Dutch', aliases: ['Flemish'] },
  { name: 'Estonian' },
  { name: 'Farsi (Persian)', aliases: ['Persian', 'Iranian'] },
  { name: 'Finnish' },
  { name: 'French' },
  { name: 'German' },
  { name: 'Greek' },
  { name: 'Gujarati' },
  { name: 'Hausa' },
  { name: 'Hebrew' },
  { name: 'Hindi' },
  { name: 'Hungarian' },
  { name: 'Igbo' },
  { name: 'Irish', aliases: ['Gaeilge', 'Irish Gaelic'] },
  { name: 'Italian' },
  { name: 'Japanese' },
  { name: 'Korean' },
  { name: 'Kurdish', aliases: ['Kurmanji', 'Sorani'] },
  { name: 'Latvian' },
  { name: 'Lithuanian' },
  { name: 'Malay' },
  { name: 'Malayalam' },
  { name: 'Mandarin', aliases: ['Chinese', 'Putonghua'] },
  { name: 'Nepali' },
  { name: 'Pahari', aliases: ['Mirpuri', 'Pothwari', 'Potwari'] },
  { name: 'Pashto', aliases: ['Pushto'] },
  { name: 'Polish' },
  { name: 'Portuguese' },
  { name: 'Punjabi', aliases: ['Panjabi'] },
  { name: 'Romanian', aliases: ['Moldovan'] },
  { name: 'Russian' },
  { name: 'Scottish Gaelic', aliases: ['Gaelic', 'Gàidhlig'] },
  { name: 'Serbian' },
  { name: 'Shona' },
  { name: 'Sinhala', aliases: ['Sinhalese'] },
  { name: 'Slovak' },
  { name: 'Somali' },
  { name: 'Spanish', aliases: ['Español', 'Castilian'] },
  { name: 'Swahili', aliases: ['Kiswahili'] },
  { name: 'Sylheti' },
  { name: 'Tagalog', aliases: ['Filipino'] },
  { name: 'Tamil' },
  { name: 'Telugu' },
  { name: 'Thai' },
  { name: 'Tigrinya' },
  { name: 'Turkish' },
  { name: 'Ukrainian' },
  { name: 'Urdu' },
  { name: 'Vietnamese' },
  { name: 'Welsh', aliases: ['Cymraeg'] },
  { name: 'Yoruba' },
];
