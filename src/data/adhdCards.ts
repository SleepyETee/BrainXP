import { ADHDCard, ADHDCardCategory } from '../types/therapy';

// ═══════════════════════════════════════════════════════════════════════════════
// ADHD PSYCHOEDUCATION CARDS
// 30-60 second reads with practical takeaways
// ═══════════════════════════════════════════════════════════════════════════════

export const ADHD_CARDS: ADHDCard[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Understanding ADHD
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'adhd-boring-tasks',
    title: 'Why your brain hates boring tasks',
    category: 'understanding_adhd',
    content: `Your ADHD brain has lower baseline dopamine activity. Dopamine is the "interest" neurotransmitter—it helps you feel motivated and engaged.

Boring tasks don't give your brain enough dopamine stimulation, so it desperately seeks it elsewhere. This isn't laziness; it's your brain's reward system working differently.

The good news: You can "hack" dopamine by adding interest to tasks, working in novel environments, or pairing boring tasks with things you enjoy.`,
    readTimeSeconds: 45,
    keyTakeaway: 'Your brain needs more stimulation than others—that\'s biology, not a character flaw.',
    practicalTips: [
      'Add music, a podcast, or background sounds to boring tasks',
      'Set a timer and race yourself',
      'Change your environment—work from a café or different room',
    ],
    relatedCards: ['adhd-motivation', 'adhd-dopamine-menu'],
    tags: ['dopamine', 'motivation', 'boredom'],
  },
  {
    id: 'adhd-time-blindness',
    title: 'Time blindness: why clocks feel fake',
    category: 'understanding_adhd',
    content: `Many people with ADHD experience "time blindness"—a genuine difficulty perceiving how long things take or how much time has passed. For you, there might only be two times: "now" and "not now."

This isn't about being irresponsible. Research shows the ADHD brain has different activity in areas that track time. Tasks that feel like 10 minutes might actually be an hour.

Understanding this helps: you're not bad at time management because you're careless. You're working with a brain that genuinely experiences time differently.`,
    readTimeSeconds: 50,
    keyTakeaway: 'Time blindness is real—use external cues (timers, alarms, visual schedules) because internal ones may not work.',
    practicalTips: [
      'Always triple your time estimates (seriously)',
      'Use visible timers, not just alarms',
      'Set "buffer alarms" 15 minutes before you need to leave',
    ],
    relatedCards: ['adhd-now-vs-not-now', 'time-management-basics'],
    tags: ['time-blindness', 'time-management', 'executive-function'],
  },
  {
    id: 'adhd-try-harder',
    title: '"Just try harder" is not a strategy',
    category: 'understanding_adhd',
    content: `If "trying harder" worked, you would have done it by now. The frustrating truth: effort and intention don't work the same way in an ADHD brain.

ADHD affects executive functions—the brain's management system. It's like having a powerful computer with an unreliable operating system. The hardware is fine; the software is inconsistent.

Real strategies work WITH your brain, not against it. External structure, environmental design, and systems that don't rely on willpower are far more effective than effort alone.`,
    readTimeSeconds: 45,
    keyTakeaway: 'Stop relying on willpower. Build systems and environments that make the right action the easy action.',
    practicalTips: [
      'Make tasks visible (if it\'s out of sight, it doesn\'t exist)',
      'Reduce friction—put things where you\'ll see/use them',
      'Use body doubling (work alongside others, virtually or in person)',
    ],
    relatedCards: ['adhd-systems-not-goals', 'adhd-environment-design'],
    tags: ['executive-function', 'willpower', 'systems'],
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Time Management
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'time-planning-fallacy',
    title: 'The planning fallacy (and how to beat it)',
    category: 'time_management',
    content: `Everyone underestimates how long things take—but ADHD brains are especially prone to the "planning fallacy." You remember how long tasks SHOULD take in ideal conditions, not how long they actually take.

This leads to packed schedules, chronic lateness, and the stress of always running behind. The solution isn't to try harder at estimating—it's to measure.

Track actual task durations for a week. You'll be shocked at the gap between expectation and reality. Then plan based on data, not hopes.`,
    readTimeSeconds: 45,
    keyTakeaway: 'Measure, don\'t guess. Track how long things actually take, then add buffer time.',
    practicalTips: [
      'Time yourself doing routine tasks this week',
      'Multiply your estimate by 1.5-2x when planning',
      'Build 10-15 minute buffers between calendar items',
    ],
    relatedCards: ['adhd-time-blindness', 'time-blocking-basics'],
    tags: ['planning', 'time-management', 'time-blindness'],
  },
  {
    id: 'reminder-fatigue',
    title: 'Why reminders stop working',
    category: 'time_management',
    content: `At first, reminders feel helpful. Then you start ignoring them. Then you add more reminders. Then you ignore those too. Welcome to reminder fatigue.

Your brain learns to dismiss notifications as "noise" when they're too frequent, poorly timed, or not actionable. The solution isn't more reminders—it's better ones.

Effective reminders are: 1) Timely (when you can actually act), 2) Contextual (where you can act), 3) Rare enough to matter, 4) Varied (changing sounds/formats).`,
    readTimeSeconds: 50,
    keyTakeaway: 'Less is more with reminders. Make each one count by timing it to when action is possible.',
    practicalTips: [
      'Set reminders for when you can act, not when tasks are due',
      'Use different notification sounds for different urgencies',
      'Try visual reminders (sticky notes, objects) instead of digital ones',
    ],
    relatedCards: ['notification-management', 'adhd-external-cues'],
    tags: ['reminders', 'notifications', 'systems'],
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Focus Strategies
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'focus-hyperfocus',
    title: 'Hyperfocus: your superpower (with a catch)',
    category: 'focus_strategies',
    content: `Hyperfocus is that magical state where you lose hours doing something fascinating. Time disappears, distractions vanish, and you're incredibly productive—IF you're focused on the right thing.

The catch: you can't always choose what you hyperfocus on. It tends to be interest-driven, not importance-driven. And breaking out of it is hard, even when you need to.

Learning to notice when hyperfocus kicks in—and gently redirecting it—is a skill. Use timers as external interrupts, and try to prime yourself for useful hyperfocus states.`,
    readTimeSeconds: 50,
    keyTakeaway: 'Hyperfocus is powerful but hard to control. Use external cues to redirect it toward what matters.',
    practicalTips: [
      'Set "exit alarms" when starting tasks prone to hyperfocus',
      'Front-load important work when you feel hyperfocus starting',
      'Remove distracting hyperfocus triggers from your environment',
    ],
    relatedCards: ['adhd-interest-based-nervous-system', 'focus-environment'],
    tags: ['hyperfocus', 'focus', 'productivity'],
  },
  {
    id: 'focus-starting',
    title: 'The hardest part is starting',
    category: 'focus_strategies',
    content: `Task initiation—the ability to simply START something—is one of the most impaired executive functions in ADHD. You know what to do, you want to do it, but somehow you just... can't begin.

This isn't laziness. Your brain's activation system works differently. It needs more stimulation to "turn on" for non-interesting tasks.

The trick is lowering the activation threshold. Make starting so small and easy that your brain barely notices. "Just open the document." "Just write one sentence." The 2-minute version.`,
    readTimeSeconds: 45,
    keyTakeaway: 'Make starting ridiculously small. Your brain will often continue once it\'s activated.',
    practicalTips: [
      'Define the smallest possible first step before stopping for the day',
      'Set a timer for just 2 minutes and give yourself permission to stop',
      'Start with the most interesting part, even if it\'s not "first"',
    ],
    relatedCards: ['adhd-tiny-habits', 'focus-momentum'],
    tags: ['task-initiation', 'starting', 'procrastination'],
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Emotional Regulation
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'emotion-rejection-sensitivity',
    title: 'Rejection sensitivity: it\'s not just in your head',
    category: 'emotional_regulation',
    content: `Many people with ADHD experience Rejection Sensitive Dysphoria (RSD)—intense emotional pain from perceived rejection or criticism. A small comment can feel catastrophic. You might avoid situations where rejection is possible.

RSD isn't weakness or oversensitivity. Brain imaging shows ADHD affects emotional regulation pathways. The feelings are real and intense, even if the trigger seems small to others.

Understanding RSD helps: knowing it's a common ADHD experience can reduce shame. And there are strategies to manage it—though it's also worth discussing with a therapist if it significantly impacts your life.`,
    readTimeSeconds: 55,
    keyTakeaway: 'Rejection sensitivity is a real ADHD symptom. Name it, expect it, and build strategies for it.',
    practicalTips: [
      'Label the feeling: "This might be RSD, not reality"',
      'Wait 24 hours before responding to perceived rejection',
      'Build a "evidence folder" of positive feedback to review',
    ],
    relatedCards: ['emotion-riding-waves', 'rsd-at-work'],
    tags: ['rsd', 'emotions', 'rejection'],
  },
  {
    id: 'emotion-overwhelm',
    title: 'When everything feels like too much',
    category: 'emotional_regulation',
    content: `ADHD overwhelm is different from regular stress. It's a shutdown response where too many inputs, tasks, or emotions flood your system at once. Your brain might freeze, panic, or desperately seek escape.

This isn't a character flaw. ADHD brains have less efficient filters for incoming information. Everything feels equally urgent and important. The overwhelm response is your brain saying "system overload."

The antidote isn't pushing through—it's reducing input. Simplify, delete, postpone. Give your brain less to process. One thing at a time.`,
    readTimeSeconds: 50,
    keyTakeaway: 'Overwhelm is a signal to simplify, not to push harder. Remove inputs before adding solutions.',
    practicalTips: [
      'Brain dump everything, then hide most of the list',
      'Ask: "What\'s the ONE thing that would help?"',
      'Give yourself permission to not do most things today',
    ],
    relatedCards: ['overwhelm-emergency-protocol', 'simplify-systems'],
    tags: ['overwhelm', 'stress', 'shutdown'],
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Organization
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'org-everything-in-one-place',
    title: 'The "one place" rule',
    category: 'organization',
    content: `ADHD brains struggle with object permanence for stuff—if something is in a drawer or folder, it effectively doesn't exist. This leads to buying duplicates, losing things, and constant searching.

The solution: everything important needs ONE visible home. Not multiple locations "just in case." One inbox, one key hook, one place for bills. Simplicity beats organization.

This also means fewer possessions. The ADHD brain works better with less. Every object is a decision and a memory load. Ruthlessly reduce what you own.`,
    readTimeSeconds: 45,
    keyTakeaway: 'One visible place for each important category. Fewer things = less to manage.',
    practicalTips: [
      'Put a bowl by the door for keys, wallet, phone—nothing else',
      'Use clear containers so you can see what\'s inside',
      'Don\'t file things—searchable digital dumps often work better',
    ],
    relatedCards: ['org-visual-systems', 'minimalism-adhd'],
    tags: ['organization', 'clutter', 'systems'],
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Coping Strategies
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'coping-body-doubling',
    title: 'Body doubling: why working alongside others helps',
    category: 'coping_strategies',
    content: `Body doubling is working in the presence of another person—even if they're doing something completely different. For many with ADHD, this simple strategy dramatically improves focus and task completion.

Why does it work? The presence of others may provide subtle accountability, reduce the loneliness of boring tasks, or help regulate your attention externally. Whatever the mechanism, it's remarkably effective.

You don't need the other person to help or even talk. They can be in the same room, on a video call, or a stranger at a café. Their presence alone makes a difference.`,
    readTimeSeconds: 45,
    keyTakeaway: 'Working near others can dramatically improve focus. Try virtual body doubling if in-person isn\'t available.',
    practicalTips: [
      'Use video coworking apps (Focusmate, Flow Club)',
      'Work from cafés, libraries, or coworking spaces',
      'Ask a friend to sit on a silent video call while you both work',
    ],
    relatedCards: ['coping-accountability', 'focus-environment'],
    tags: ['body-doubling', 'focus', 'strategies'],
  },
  {
    id: 'coping-dopamine-menu',
    title: 'Build a dopamine menu',
    category: 'coping_strategies',
    content: `Your ADHD brain is constantly seeking dopamine. When you don't give it healthy options, it finds unhealthy ones—doom scrolling, impulsive shopping, arguments, etc.

A "dopamine menu" is a list of go-to activities that provide stimulation without harm. Have options for different time frames (1 min, 5 min, 30 min) and energy levels. Keep it visible and updated.

The key is having options BEFORE you need them. In the moment of seeking stimulation, your brain won't generate good ideas. It'll default to whatever's easiest.`,
    readTimeSeconds: 50,
    keyTakeaway: 'Prepare healthy dopamine options in advance. Your brain will grab whatever\'s available.',
    practicalTips: [
      'List 3 quick things (< 5 min): stretch, short walk, fun video',
      'List 3 medium things (15-30 min): podcast, creative hobby, exercise',
      'Keep the list on your phone lock screen or wall',
    ],
    relatedCards: ['adhd-boring-tasks', 'self-care-basics'],
    tags: ['dopamine', 'self-care', 'strategies'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGERED EDUCATION RULES
// Maps triggers to relevant card IDs
// ═══════════════════════════════════════════════════════════════════════════════

export const TRIGGERED_CARD_RULES: Record<string, string[]> = {
  reminder_fatigue: ['reminder-fatigue'],
  repeated_snoozing: ['reminder-fatigue', 'time-planning-fallacy'],
  task_abandonment: ['focus-starting', 'emotion-overwhelm'],
  focus_interruptions: ['focus-hyperfocus', 'adhd-boring-tasks'],
  mood_patterns: ['emotion-rejection-sensitivity', 'emotion-overwhelm'],
  procrastination: ['focus-starting', 'adhd-try-harder'],
  time_issues: ['adhd-time-blindness', 'time-planning-fallacy'],
  organization: ['org-everything-in-one-place'],
};

// Helper to get a card by ID
export const getCardById = (id: string): ADHDCard | undefined => {
  return ADHD_CARDS.find((card) => card.id === id);
};

// Get cards by category
export const getCardsByCategory = (category: ADHDCardCategory): ADHDCard[] => {
  return ADHD_CARDS.filter((card) => card.category === category);
};

// Get all categories with counts
export const getCategoryCounts = (): Record<ADHDCardCategory, number> => {
  const counts: Record<string, number> = {};
  ADHD_CARDS.forEach((card) => {
    counts[card.category] = (counts[card.category] || 0) + 1;
  });
  return counts as Record<ADHDCardCategory, number>;
};
