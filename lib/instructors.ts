export type Instructor = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  reviews: number;
  lessonsGiven: number;
  pricePerHour: number;
  transmission: string[];
  specialisms: string[];
  areas: string[];
  color: string;
  slotsToday: number;
  yearsExp: number;
  car: string;
  bio: string;
  dbsVerified: boolean;
  adiNumber: string;
};

export type Slot = {
  time: string;
  avail: boolean;
  tag: 'Early' | 'Evening' | 'Taken' | null;
};

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'sarah',
    name: 'Sarah Mitchell',
    initials: 'SM',
    rating: 4.9,
    reviews: 127,
    lessonsGiven: 340,
    pricePerHour: 38,
    transmission: ['Manual'],
    specialisms: ['Nervous learners', 'Pass Plus'],
    areas: ['Norwich City', 'Thorpe St Andrew', 'Hellesdon'],
    color: '#2D6A4F',
    slotsToday: 2,
    yearsExp: 8,
    car: 'Ford Fiesta, Manual',
    bio: 'Patient and calm. Specialist in nervous learners getting back on track.',
    dbsVerified: true,
    adiNumber: 'ADI-2847',
  },
  {
    id: 'james',
    name: 'James Okafor',
    initials: 'JO',
    rating: 4.8,
    reviews: 89,
    lessonsGiven: 210,
    pricePerHour: 36,
    transmission: ['Manual', 'Automatic'],
    specialisms: ['Intensive courses', 'Test prep'],
    areas: ['Dereham Rd', 'Earlham', 'Bowthorpe'],
    color: '#1A3A5C',
    slotsToday: 0,
    yearsExp: 5,
    car: 'Vauxhall Corsa, Manual',
    bio: 'Fast-track specialist. Average pass in under 30 hours.',
    dbsVerified: true,
    adiNumber: 'ADI-3912',
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    initials: 'PS',
    rating: 5.0,
    reviews: 64,
    lessonsGiven: 140,
    pricePerHour: 40,
    transmission: ['Automatic'],
    specialisms: ['Automatic only', 'Mature learners'],
    areas: ['Wymondham', 'Hethersett', 'Cringleford'],
    color: '#E8527A',
    slotsToday: 3,
    yearsExp: 6,
    car: 'Toyota Yaris, Automatic',
    bio: '100% five-star reviews. Automatic specialist.',
    dbsVerified: true,
    adiNumber: 'ADI-4421',
  },
  {
    id: 'tom',
    name: 'Tom Harrison',
    initials: 'TH',
    rating: 4.7,
    reviews: 201,
    lessonsGiven: 580,
    pricePerHour: 35,
    transmission: ['Manual'],
    specialisms: ['Young drivers', 'Rural roads'],
    areas: ['Sprowston', 'Old Catton', 'Costessey'],
    color: '#5C3A1E',
    slotsToday: 4,
    yearsExp: 12,
    car: 'Nissan Micra, Manual',
    bio: 'Norfolk born and bred. Most affordable in the area.',
    dbsVerified: true,
    adiNumber: 'ADI-1103',
  },
];

export const SLOTS: Slot[] = [
  { time: '7:00 am', avail: true, tag: 'Early' },
  { time: '9:00 am', avail: true, tag: null },
  { time: '11:00 am', avail: false, tag: 'Taken' },
  { time: '1:00 pm', avail: true, tag: null },
  { time: '3:00 pm', avail: true, tag: null },
  { time: '5:00 pm', avail: false, tag: 'Taken' },
  { time: '7:00 pm', avail: true, tag: 'Evening' },
];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function getInstructor(id: string): Instructor {
  const found = INSTRUCTORS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown instructor: ${id}`);
  return found;
}
