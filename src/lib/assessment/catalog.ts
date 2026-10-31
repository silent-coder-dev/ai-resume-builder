// Everything a candidate can test themselves on. The browser shows this list and
// the server uses it to validate requests, so adding a test is one entry here.

export type RoundKind = 'mcq' | 'coding' | 'sql';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TrackGroup {
  id: string;
  title: string;
  description: string;
}

export interface Track {
  id: string;
  group: string;
  kind: RoundKind;
  title: string;
  description: string;
  topics: string[];
  // Exam context for the question writer.
  brief: string;
  secondsPerQuestion?: number;
  // Marks lost per wrong answer, as in the real exam pattern.
  negativeMark?: number;
}

export const TRACK_GROUPS: TrackGroup[] = [
  { id: 'cs', title: 'Engineering & CS', description: 'Coding and SQL rounds, plus core CS subjects for B.Tech and CS students.' },
  { id: 'placement', title: 'Placement Aptitude', description: 'The aptitude rounds most companies run before interviews.' },
  { id: 'government', title: 'Government Exams', description: 'Exam-pattern practice with negative marking.' },
  { id: 'branches', title: 'Other Fields', description: 'Core subjects for other engineering branches, commerce, and management.' },
];

const DSA_TOPICS = [
  'Arrays',
  'Strings',
  'Hash Maps',
  'Two Pointers',
  'Sliding Window',
  'Sorting & Searching',
  'Recursion & Backtracking',
  'Stacks & Queues',
  'Linked Lists',
  'Trees',
  'Graphs',
  'Greedy',
  'Dynamic Programming',
  'Bit Manipulation',
  'Math',
];

const CORE_GA = ['Indian Polity', 'Indian History', 'Geography', 'Indian Economy', 'General Science', 'Static GK'];

export const TRACKS: Track[] = [
  // Engineering & CS
  {
    id: 'coding',
    group: 'cs',
    kind: 'coding',
    title: 'Coding Round',
    description: 'Solve problems in a real compiler with public and hidden test cases. Java, Python, C, C++, and C#.',
    topics: DSA_TOPICS,
    brief: 'Campus placement coding round',
  },
  {
    id: 'sql',
    group: 'cs',
    kind: 'sql',
    title: 'SQL Round',
    description: 'Write queries against a real database, with public and hidden data checks.',
    topics: ['SELECT & Filtering', 'Sorting & LIMIT', 'Aggregates & GROUP BY', 'HAVING', 'INNER & OUTER JOINs', 'Self Joins', 'Subqueries', 'CTEs', 'Window Functions', 'Dates & Strings', 'NULL Handling'],
    brief: 'Campus placement SQL round (SQLite syntax)',
  },
  {
    id: 'java',
    group: 'cs',
    kind: 'mcq',
    title: 'Java & OOP',
    description: 'OOP concepts, core Java, collections, and tricky output questions.',
    topics: ['OOP Concepts', 'Inheritance & Polymorphism', 'Abstraction & Interfaces', 'Encapsulation', 'Exception Handling', 'Collections', 'Generics', 'Multithreading', 'Strings & Immutability', 'JVM & Memory', 'Java 8 Streams', 'Output Prediction'],
    brief: 'Technical MCQ test on Java and object-oriented programming, including code output questions',
  },
  {
    id: 'python',
    group: 'cs',
    kind: 'mcq',
    title: 'Python',
    description: 'Core Python, data structures, OOP, and output questions.',
    topics: ['Data Types', 'Lists, Tuples & Dicts', 'Functions & Scope', 'OOP in Python', 'Decorators & Generators', 'Exceptions', 'Modules', 'Output Prediction'],
    brief: 'Technical MCQ test on Python, including code output questions',
  },
  {
    id: 'c-cpp',
    group: 'cs',
    kind: 'mcq',
    title: 'C & C++',
    description: 'Pointers, memory, OOP in C++, and the STL.',
    topics: ['Pointers', 'Memory Management', 'Arrays & Strings', 'Structures', 'OOP in C++', 'Templates & STL', 'Virtual Functions', 'Output Prediction'],
    brief: 'Technical MCQ test on C and C++, including code output questions',
  },
  {
    id: 'dsa-mcq',
    group: 'cs',
    kind: 'mcq',
    title: 'Data Structures & Algorithms',
    description: 'Concepts, complexity, and tracing without writing code.',
    topics: ['Time & Space Complexity', 'Arrays & Linked Lists', 'Stacks & Queues', 'Trees & BST', 'Heaps', 'Hashing', 'Graphs', 'Sorting', 'Dynamic Programming'],
    brief: 'Technical MCQ test on data structures and algorithms',
  },
  {
    id: 'dbms',
    group: 'cs',
    kind: 'mcq',
    title: 'DBMS',
    description: 'Normalization, transactions, indexing, and SQL theory.',
    topics: ['ER Model', 'Normalization', 'Transactions & ACID', 'Concurrency Control', 'Indexing', 'SQL Theory', 'Keys & Constraints'],
    brief: 'Technical MCQ test on database management systems',
  },
  {
    id: 'os',
    group: 'cs',
    kind: 'mcq',
    title: 'Operating Systems',
    description: 'Processes, scheduling, memory, and deadlocks.',
    topics: ['Processes & Threads', 'CPU Scheduling', 'Synchronization', 'Deadlocks', 'Memory Management', 'Virtual Memory', 'File Systems'],
    brief: 'Technical MCQ test on operating systems',
  },
  {
    id: 'cn',
    group: 'cs',
    kind: 'mcq',
    title: 'Computer Networks',
    description: 'OSI and TCP/IP, routing, and common protocols.',
    topics: ['OSI & TCP/IP', 'IP Addressing & Subnetting', 'TCP vs UDP', 'Routing', 'HTTP, DNS & DHCP', 'Network Security'],
    brief: 'Technical MCQ test on computer networks',
  },
  {
    id: 'web',
    group: 'cs',
    kind: 'mcq',
    title: 'Web Development',
    description: 'HTML, CSS, JavaScript, React, and REST APIs.',
    topics: ['HTML & CSS', 'JavaScript Fundamentals', 'Async JavaScript', 'React', 'Node.js', 'REST APIs', 'Web Security'],
    brief: 'Technical MCQ test on web development',
  },

  // Placement aptitude
  {
    id: 'quant',
    group: 'placement',
    kind: 'mcq',
    title: 'Quantitative Aptitude',
    description: 'Percentages, ratios, time and work, probability, and more.',
    topics: ['Percentages', 'Profit & Loss', 'Ratio & Proportion', 'Time & Work', 'Speed, Time & Distance', 'Simple & Compound Interest', 'Averages', 'Probability', 'Permutations & Combinations', 'Number System'],
    brief: 'Campus placement quantitative aptitude test',
    secondsPerQuestion: 75,
  },
  {
    id: 'reasoning',
    group: 'placement',
    kind: 'mcq',
    title: 'Logical Reasoning',
    description: 'Series, coding-decoding, puzzles, and arrangements.',
    topics: ['Number & Letter Series', 'Coding-Decoding', 'Blood Relations', 'Direction Sense', 'Seating Arrangement', 'Syllogisms', 'Puzzles'],
    brief: 'Campus placement logical reasoning test',
    secondsPerQuestion: 75,
  },
  {
    id: 'verbal',
    group: 'placement',
    kind: 'mcq',
    title: 'Verbal Ability',
    description: 'Grammar, vocabulary, and comprehension.',
    topics: ['Grammar', 'Sentence Correction', 'Synonyms & Antonyms', 'Para Jumbles', 'Reading Comprehension', 'Fill in the Blanks'],
    brief: 'Campus placement English verbal ability test',
    secondsPerQuestion: 50,
  },
  {
    id: 'data-interpretation',
    group: 'placement',
    kind: 'mcq',
    title: 'Data Interpretation',
    description: 'Tables, percentages, and comparisons from data sets.',
    topics: ['Tables', 'Percentage Comparison', 'Ratio from Data', 'Data Sufficiency'],
    brief: 'Campus placement data interpretation test; describe any table in the question text',
    secondsPerQuestion: 90,
  },

  // Government exams
  {
    id: 'ssc-cgl',
    group: 'government',
    kind: 'mcq',
    title: 'SSC CGL',
    description: 'Tier 1 pattern: reasoning, GA, quant, and English. −0.5 per wrong answer.',
    topics: ['Quantitative Aptitude', 'General Intelligence & Reasoning', 'English Comprehension', 'General Awareness', ...CORE_GA],
    brief: 'SSC CGL Tier 1 exam pattern (India)',
    secondsPerQuestion: 36,
    negativeMark: 0.5,
  },
  {
    id: 'ssc-chsl',
    group: 'government',
    kind: 'mcq',
    title: 'SSC CHSL',
    description: 'Tier 1 pattern for 10+2 level posts. −0.5 per wrong answer.',
    topics: ['Quantitative Aptitude', 'General Intelligence', 'English Language', 'General Awareness'],
    brief: 'SSC CHSL Tier 1 exam pattern (India)',
    secondsPerQuestion: 36,
    negativeMark: 0.5,
  },
  {
    id: 'bank-po',
    group: 'government',
    kind: 'mcq',
    title: 'Bank PO (IBPS / SBI)',
    description: 'Prelims pattern: English, quant, and reasoning. −0.25 per wrong answer.',
    topics: ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'Banking Awareness', 'Data Interpretation'],
    brief: 'IBPS PO and SBI PO prelims exam pattern (India)',
    secondsPerQuestion: 36,
    negativeMark: 0.25,
  },
  {
    id: 'bank-clerk',
    group: 'government',
    kind: 'mcq',
    title: 'Bank Clerk (IBPS / SBI)',
    description: 'Prelims pattern for clerical posts. −0.25 per wrong answer.',
    topics: ['Numerical Ability', 'Reasoning Ability', 'English Language', 'Banking Awareness'],
    brief: 'IBPS Clerk and SBI Clerk prelims exam pattern (India)',
    secondsPerQuestion: 36,
    negativeMark: 0.25,
  },
  {
    id: 'rrb-ntpc',
    group: 'government',
    kind: 'mcq',
    title: 'Railways RRB NTPC',
    description: 'CBT pattern: maths, reasoning, and general awareness. −⅓ per wrong answer.',
    topics: ['Mathematics', 'General Intelligence & Reasoning', 'General Awareness', ...CORE_GA],
    brief: 'RRB NTPC CBT exam pattern (India)',
    secondsPerQuestion: 54,
    negativeMark: 0.33,
  },
  {
    id: 'upsc-prelims',
    group: 'government',
    kind: 'mcq',
    title: 'UPSC Prelims (GS)',
    description: 'General Studies Paper I style. −⅓ of a question’s marks per wrong answer.',
    topics: ['Indian Polity', 'Modern Indian History', 'Ancient & Medieval History', 'Geography', 'Indian Economy', 'Environment & Ecology', 'Science & Technology', 'Art & Culture'],
    brief: 'UPSC Civil Services Prelims General Studies Paper I pattern (India), with statement-based questions',
    secondsPerQuestion: 72,
    negativeMark: 0.33,
  },
  {
    id: 'state-psc',
    group: 'government',
    kind: 'mcq',
    title: 'State PSC (General Studies)',
    description: 'General studies common to state public service exams.',
    topics: CORE_GA,
    brief: 'Indian State Public Service Commission prelims general studies pattern',
    secondsPerQuestion: 60,
    negativeMark: 0.33,
  },
  {
    id: 'defence',
    group: 'government',
    kind: 'mcq',
    title: 'Defence (NDA / CDS)',
    description: 'Maths, English, and general knowledge.',
    topics: ['Mathematics', 'English', 'General Knowledge', 'General Science', 'Indian History', 'Geography'],
    brief: 'NDA and CDS exam pattern (India)',
    secondsPerQuestion: 60,
    negativeMark: 0.33,
  },

  // Other fields
  {
    id: 'mechanical',
    group: 'branches',
    kind: 'mcq',
    title: 'Mechanical Engineering',
    description: 'Thermodynamics, strength of materials, and fluids.',
    topics: ['Thermodynamics', 'Strength of Materials', 'Fluid Mechanics', 'Theory of Machines', 'Manufacturing'],
    brief: 'Mechanical engineering core subject test',
  },
  {
    id: 'electrical',
    group: 'branches',
    kind: 'mcq',
    title: 'Electrical & Electronics',
    description: 'Circuits, machines, and digital electronics.',
    topics: ['Network Theory', 'Electrical Machines', 'Power Systems', 'Analog Electronics', 'Digital Electronics', 'Control Systems'],
    brief: 'Electrical and electronics engineering core subject test',
  },
  {
    id: 'civil',
    group: 'branches',
    kind: 'mcq',
    title: 'Civil Engineering',
    description: 'Structures, soil mechanics, and surveying.',
    topics: ['Structural Analysis', 'Soil Mechanics', 'Surveying', 'Concrete Technology', 'Transportation', 'Hydraulics'],
    brief: 'Civil engineering core subject test',
  },
  {
    id: 'finance',
    group: 'branches',
    kind: 'mcq',
    title: 'Finance & Accounting',
    description: 'Accounting basics, financial statements, and ratios.',
    topics: ['Accounting Basics', 'Financial Statements', 'Ratio Analysis', 'Taxation Basics', 'Corporate Finance'],
    brief: 'Finance and accounting aptitude test',
  },
  {
    id: 'management',
    group: 'branches',
    kind: 'mcq',
    title: 'Management & Marketing',
    description: 'Marketing, HR, and business fundamentals.',
    topics: ['Principles of Management', 'Marketing', 'Human Resources', 'Business Communication', 'Business Ethics'],
    brief: 'Management and marketing aptitude test',
  },
];

export const getTrack = (id: unknown): Track | undefined => TRACKS.find((track) => track.id === id);

export const DEFAULT_SECONDS_PER_QUESTION = 60;

// Time for a coding or SQL problem, in minutes.
export const PROBLEM_MINUTES: Record<RoundKind, Record<Difficulty, number>> = {
  coding: { easy: 20, medium: 30, hard: 45 },
  sql: { easy: 10, medium: 15, hard: 25 },
  mcq: { easy: 0, medium: 0, hard: 0 },
};

// Topics the candidate chose, or the free-text topic, limited for the prompt.
export function cleanTopics(track: Track, topics: unknown, customTopic: unknown): string[] {
  const chosen = Array.isArray(topics) ? topics.filter((topic): topic is string => track.topics.includes(topic as string)) : [];
  const custom = typeof customTopic === 'string' ? customTopic.replace(/[\r\n]+/g, ' ').trim().slice(0, 80) : '';
  const all = custom ? [...chosen, custom] : chosen;
  return all.length > 0 ? all : track.topics;
}
