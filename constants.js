// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const C_SM = 2 * Math.PI * 22; // hub card ring r=22 in 50x50 viewBox
const C_LG = 2 * Math.PI * 38; // schedule ring r=38 in 88x88 viewBox

const LEVELS = {
  health: [
    {name:'Couch Potato',       min:0},
    {name:'Weekend Warrior',    min:150},
    {name:'Health Curious',     min:400},
    {name:'Health Enthusiast',  min:800},
    {name:'Optimizer',          min:1400},
    {name:'Biohacker',          min:2200},
    {name:'Longevity Legend',      min:3500},
    {name:'Elite Performer',       min:5500},
    {name:'Peak Human',            min:8500},
    {name:'Longevity Architect',   min:13000},
    {name:'Centenarian Candidate', min:20000},
    {name:'Demigod',               min:30000},
    {name:'Transcendent',          min:45000},
  ],
  degen: [
    {name:'Absolute Degenerate',    min:0},
    {name:'Slightly Less Bad',      min:150},
    {name:'Attempting Human',       min:400},
    {name:'Functioning Adult',      min:800},
    {name:'Respectable Person',     min:1400},
    {name:'Reformed',               min:2200},
    {name:'Devil Is Disappointed',   min:3500},
    {name:'Suspicious Improvement',  min:5500},
    {name:'Unrecognizable',          min:8500},
    {name:'Mom Is Proud',            min:13000},
    {name:'Dealer Lost A Customer',  min:20000},
    {name:'Certified Ex-Degenerate', min:30000},
    {name:'A Different Species',     min:45000},
  ]
};

const AVATAR_COLORS = ['#2dd46e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const AVATAR_ICONS = [
  { icon:'🥚', minRank:0 },
  { icon:'🐛', minRank:0 },
  { icon:'🐌', minRank:0 },
  { icon:'🐣', minRank:0 },
  { icon:'🐢', minRank:0 },
  { icon:'🦊', minRank:3  },
  { icon:'🐺', minRank:4  },
  { icon:'🦁', minRank:5  },
  { icon:'🦅', minRank:6  },
  { icon:'🐉', minRank:7  },
  { icon:'🦈', minRank:8  },
  { icon:'🦋', minRank:9  },
  { icon:'🧙', minRank:10 },
  { icon:'🤖', minRank:11 },
  { icon:'🔱', minRank:12 },
  { icon:'☀️', minRank:13 },
];
