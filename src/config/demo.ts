// Sample data for demo mode. Every generated record has is_demo = true.

export const DEMO_WORKER_COUNT = 40;
export const DEMO_NEED_SHARE = 0.3; // fraction of enterprises that get a need
export const DEMO_NEED_SHARE_OTHER = 0.08; // ...for uncategorised shops

// The demo script needs "a nearby workshop needing a welder". Prefer a
// workshop whose name looks like metal/engineering work.
export const DEMO_WELDER_WORKSHOP_NAME = /weld|engineer|fabricat|metal|steel|iron|works/i;

export const DEMO_FIRST_NAMES = [
  "Rahul", "Sujit", "Bikash", "Pranjal", "Ratul", "Dipankar", "Subrata", "Manik",
  "Bablu", "Mintu", "Rafiqul", "Anwar", "Jahangir", "Abdul", "Sahidul", "Nayan",
  "Ranjit", "Biswajit", "Hemanta", "Pulak", "Tapan", "Gautam", "Ajoy", "Liton",
  "Jiten", "Mridul", "Bhaskar", "Rupam", "Sanjib", "Imran", "Habibur", "Kamal",
  "Amit", "Sunil", "Rajesh", "Dhiren", "Prasanta", "Nitul", "Mukul", "Arup",
];

export const DEMO_LAST_NAMES = [
  "Das", "Mondal", "Gogoi", "Bora", "Saikia", "Barman", "Roy", "Sarkar",
  "Sheikh", "Islam", "Hussain", "Alam", "Karim", "Ali", "Kalita", "Deka",
  "Baruah", "Nath", "Paul", "Ghosh", "Biswas", "Mahato", "Rabha", "Boro",
];

// home state -> languages spoken
export const DEMO_HOME_STATES: { state: string; languages: string[]; weight: number }[] = [
  { state: "Assam", languages: ["Assamese", "Hindi"], weight: 4 },
  { state: "West Bengal", languages: ["Bengali", "Hindi"], weight: 4 },
  { state: "Odisha", languages: ["Odia", "Hindi"], weight: 1 },
  { state: "Bihar", languages: ["Hindi"], weight: 1 },
  { state: "Jharkhand", languages: ["Hindi"], weight: 1 },
];

// Skills demo workers are drawn from, with relative frequency.
export const DEMO_SKILL_WEIGHTS: Record<string, number> = {
  helper: 8,
  loader: 4,
  welder: 4,
  cook: 4,
  kitchen_helper: 4,
  mason: 3,
  plywood_press_operator: 3,
  machine_operator: 3,
  cleaner: 3,
  waiter: 3,
  painter: 2,
  carpenter: 2,
  electrician: 2,
  fitter: 2,
  baker: 2,
  juice_maker: 2,
  plumber: 1,
  driver: 1,
  roofing_worker: 1,
  security: 1,
};

export const DEMO_RATING_NOTES = [
  "Hard working, comes on time",
  "Good worker, owner happy",
  "Learns fast",
  "Needs supervision at first",
  "Very reliable",
];
