// filepath: /Users/sleepyet/BrainXP/backend/src/seed.ts
/**
 * Database Seeding Script
 * Creates sample data for development and testing
 * 
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Development user IDs
const DEV_USER_ID = 'dev-user-id';
const MOCK_USER_ID = 'mock-user-id';

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data for dev users
  console.log('🧹 Cleaning existing dev data...');
  await cleanDevData();

  // Seed data for both dev users
  for (const userId of [DEV_USER_ID, MOCK_USER_ID]) {
    console.log(`\n📦 Seeding data for user: ${userId}`);
    
    // First create the user
    await seedUser(userId);
    
    await seedTaskLists(userId);
    await seedSmartLists(userId);
    await seedTasks(userId);
    await seedHabits(userId);
    await seedFocusSessions(userId);
    await seedTimelineBlocks(userId);
    await seedUserProgress(userId);
    await seedMoodEntries(userId);
    await seedWidgetPresets(userId);
  }

  console.log('\n✅ Database seeding complete!');
}

async function cleanDevData() {
  const userIds = [DEV_USER_ID, MOCK_USER_ID];
  
  // Delete in order to respect foreign key constraints
  await prisma.xPEvent.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.userBadge.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.moodEntry.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.habitLog.deleteMany({ where: { habit: { userId: { in: userIds } } } });
  await prisma.habit.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.focusSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.timelineBlock.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.taskChecklistItem.deleteMany({ where: { task: { userId: { in: userIds } } } });
  await prisma.task.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.smartList.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.taskList.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.widgetPreset.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.userProgress.deleteMany({ where: { userId: { in: userIds } } });
  // Delete users last
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function seedUser(userId: string) {
  console.log('  👤 Creating user...');
  
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      firebaseUid: userId,
      email: userId === DEV_USER_ID ? 'dev@example.com' : 'user@example.com',
      name: userId === DEV_USER_ID ? 'Dev User' : 'Test User',
      onboardingComplete: true,
      adhdExperience: 'diagnosed',
      primaryGoals: ['focus', 'organization', 'habits'],
      biggestChallenge: 'staying focused',
    },
  });
}

async function seedTaskLists(userId: string) {
  console.log('  📋 Creating task lists...');
  
  await prisma.taskList.createMany({
    data: [
      { id: `${userId}-inbox`, userId, name: 'Inbox', icon: '📥', color: '#2563EB', order: 0, isPinned: true, isDefault: true },
      { id: `${userId}-work`, userId, name: 'Work', icon: '💼', color: '#0EA5E9', order: 1, isPinned: true, isDefault: false },
      { id: `${userId}-personal`, userId, name: 'Personal', icon: '🏡', color: '#22C55E', order: 2, isPinned: true, isDefault: false },
      { id: `${userId}-learning`, userId, name: 'Learning', icon: '📚', color: '#8B5CF6', order: 3, isPinned: false, isDefault: false },
      { id: `${userId}-health`, userId, name: 'Health', icon: '💪', color: '#EC4899', order: 4, isPinned: false, isDefault: false },
    ],
  });
}

async function seedSmartLists(userId: string) {
  console.log('  🎯 Creating smart lists...');
  
  await prisma.smartList.createMany({
    data: [
      {
        userId,
        slug: 'today',
        name: 'Today',
        icon: '☀️',
        color: '#2563EB',
        preset: true,
        pinned: true,
        filters: { due: 'today', statusNot: ['done', 'abandoned'] },
      },
      {
        userId,
        slug: 'next-7-days',
        name: 'Next 7 Days',
        icon: '🗓️',
        color: '#16A34A',
        preset: true,
        pinned: true,
        filters: { due: 'next_7_days', statusNot: ['done', 'abandoned'] },
      },
      {
        userId,
        slug: 'overdue',
        name: 'Overdue',
        icon: '⏰',
        color: '#DC2626',
        preset: true,
        pinned: false,
        filters: { due: 'overdue', statusNot: ['done', 'abandoned'] },
      },
      {
        userId,
        slug: 'priority',
        name: 'High Priority',
        icon: '⭐',
        color: '#F59E0B',
        preset: true,
        pinned: false,
        filters: { priority: ['urgent_important', 'important', 'urgent'], statusNot: ['done', 'abandoned'] },
      },
    ],
  });
}

async function seedTasks(userId: string) {
  console.log('  ✅ Creating tasks...');
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tasks = await prisma.task.createMany({
    data: [
      // Today's tasks
      {
        userId,
        title: 'Review project proposal',
        description: 'Go through the Q1 project proposal and add feedback',
        status: 'todo',
        priority: 'important',
        energyRequired: 'high',
        tags: ['work', 'review'],
        estimatedMinutes: 45,
        dueDate: today,
        listId: `${userId}-work`,
        order: 0,
      },
      {
        userId,
        title: 'Send weekly update email',
        description: 'Summarize this week\'s progress for the team',
        status: 'todo',
        priority: 'urgent',
        energyRequired: 'medium',
        tags: ['work', 'communication'],
        estimatedMinutes: 20,
        dueDate: today,
        listId: `${userId}-work`,
        order: 1,
      },
      {
        userId,
        title: 'Grocery shopping',
        description: 'Get ingredients for the week',
        status: 'todo',
        priority: 'none',
        energyRequired: 'low',
        tags: ['personal', 'errands'],
        estimatedMinutes: 45,
        scheduledDate: today,
        listId: `${userId}-personal`,
        order: 2,
      },
      // Tomorrow's tasks
      {
        userId,
        title: 'Prepare presentation slides',
        description: 'Create slides for the client meeting',
        status: 'todo',
        priority: 'urgent_important',
        energyRequired: 'high',
        tags: ['work', 'presentation'],
        estimatedMinutes: 90,
        dueDate: tomorrow,
        listId: `${userId}-work`,
        order: 3,
      },
      {
        userId,
        title: 'Call mom',
        description: 'Catch up and wish her a good week',
        status: 'todo',
        priority: 'none',
        energyRequired: 'low',
        tags: ['personal', 'family'],
        estimatedMinutes: 30,
        dueDate: tomorrow,
        listId: `${userId}-personal`,
        order: 4,
      },
      // Next week
      {
        userId,
        title: 'Complete online course module',
        description: 'Finish module 3 of the TypeScript course',
        status: 'todo',
        priority: 'important',
        energyRequired: 'medium',
        tags: ['learning', 'coding'],
        estimatedMinutes: 60,
        dueDate: nextWeek,
        listId: `${userId}-learning`,
        order: 5,
      },
      {
        userId,
        title: 'Schedule dentist appointment',
        description: 'Regular checkup - been 6 months',
        status: 'todo',
        priority: 'low',
        energyRequired: 'low',
        tags: ['health'],
        estimatedMinutes: 10,
        dueDate: nextWeek,
        listId: `${userId}-health`,
        order: 6,
      },
      // Completed tasks (for stats)
      {
        userId,
        title: 'Set up development environment',
        status: 'done',
        priority: 'important',
        energyRequired: 'medium',
        tags: ['work', 'setup'],
        estimatedMinutes: 30,
        completedAt: yesterday,
        listId: `${userId}-work`,
        order: 7,
      },
      {
        userId,
        title: 'Morning jog',
        status: 'done',
        priority: 'none',
        energyRequired: 'medium',
        tags: ['health', 'exercise'],
        estimatedMinutes: 30,
        completedAt: yesterday,
        listId: `${userId}-health`,
        order: 8,
      },
      // Inbox items
      {
        userId,
        title: 'Research new productivity tools',
        status: 'inbox',
        priority: 'none',
        energyRequired: 'low',
        tags: [],
        listId: `${userId}-inbox`,
        order: 9,
      },
      {
        userId,
        title: 'Book birthday dinner reservation',
        status: 'inbox',
        priority: 'none',
        energyRequired: 'low',
        tags: [],
        listId: `${userId}-inbox`,
        order: 10,
      },
    ],
  });

  console.log(`    Created ${tasks.count} tasks`);
}

async function seedHabits(userId: string) {
  console.log('  🔄 Creating habits...');
  
  const habits = await prisma.habit.createMany({
    data: [
      {
        userId,
        name: 'Morning Meditation',
        icon: '🧘',
        color: '#3B82F6',
        frequencyType: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        targetCount: 1,
        allowPartialCredit: true,
        preferredTime: '07:00',
        reminderEnabled: true,
        reminderTime: '07:00',
      },
      {
        userId,
        name: 'Exercise',
        icon: '💪',
        color: '#EC4899',
        frequencyType: 'specific_days',
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        targetCount: 1,
        allowPartialCredit: true,
        preferredTime: '18:00',
        reminderEnabled: true,
        reminderTime: '17:30',
      },
      {
        userId,
        name: 'Read for 30 minutes',
        icon: '📚',
        color: '#8B5CF6',
        frequencyType: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        targetCount: 1,
        allowPartialCredit: true,
        preferredTime: '21:00',
        reminderEnabled: false,
      },
      {
        userId,
        name: 'Drink 8 glasses of water',
        icon: '💧',
        color: '#0EA5E9',
        frequencyType: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        targetCount: 8,
        allowPartialCredit: true,
        reminderEnabled: false,
      },
      {
        userId,
        name: 'Practice gratitude',
        icon: '🙏',
        color: '#22C55E',
        frequencyType: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        targetCount: 1,
        allowPartialCredit: false,
        preferredTime: '22:00',
        reminderEnabled: true,
        reminderTime: '21:45',
      },
    ],
  });

  // Add some habit logs for the past week
  const habitsList = await prisma.habit.findMany({ where: { userId } });
  
  for (const habit of habitsList) {
    for (let i = 1; i <= 7; i++) {
      const logDate = new Date();
      logDate.setDate(logDate.getDate() - i);
      logDate.setHours(0, 0, 0, 0);
      
      // Random completion (70% chance of completion)
      const completed = Math.random() > 0.3;
      
      await prisma.habitLog.create({
        data: {
          habitId: habit.id,
          date: logDate,
          completed,
          partialCredit: completed ? 1.0 : Math.random() > 0.5 ? 0.5 : 0,
        },
      });
    }
  }

  console.log(`    Created ${habits.count} habits with logs`);
}

async function seedFocusSessions(userId: string) {
  console.log('  ⏱️ Creating focus sessions...');
  
  const sessions = [];
  
  for (let i = 1; i <= 10; i++) {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - Math.floor(i / 2));
    startTime.setHours(9 + (i % 8), 0, 0, 0);
    
    const plannedDuration = [25, 25, 50, 25, 45, 25, 25, 50, 25, 30][i - 1];
    const actualDuration = plannedDuration - Math.floor(Math.random() * 5);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + actualDuration);
    
    sessions.push({
      userId,
      taskDescription: [
        'Deep work on project',
        'Code review',
        'Writing documentation',
        'Learning new framework',
        'Bug fixing',
        'Planning sprint',
        'Research',
        'Design work',
        'Email processing',
        'Creative brainstorming',
      ][i - 1],
      plannedDuration,
      actualDuration,
      sessionType: i % 3 === 0 ? 'deep_work' : 'pomodoro',
      breakDuration: 5,
      longBreakDuration: 15,
      autoContinue: false,
      startTime,
      endTime,
      status: 'completed',
      outcome: 'completed',
      qualityRating: 3 + Math.floor(Math.random() * 3),
      completedTask: Math.random() > 0.5,
      xpEarned: 15 + Math.floor(actualDuration / 10) * 5,
      interruptions: [],
    });
  }

  await prisma.focusSession.createMany({ data: sessions });
  console.log(`    Created ${sessions.length} focus sessions`);
}

async function seedTimelineBlocks(userId: string) {
  console.log('  📅 Creating timeline blocks...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  const blocks = [
    {
      userId,
      title: 'Morning Routine',
      type: 'routine',
      startTime: new Date(`${todayStr}T07:00:00`),
      endTime: new Date(`${todayStr}T08:00:00`),
      day: today,
      color: '#22C55E',
      isBuffer: false,
      order: 0,
    },
    {
      userId,
      title: 'Deep Work Block',
      type: 'focus',
      startTime: new Date(`${todayStr}T09:00:00`),
      endTime: new Date(`${todayStr}T11:00:00`),
      day: today,
      color: '#3B82F6',
      isBuffer: false,
      order: 1,
    },
    {
      userId,
      title: 'Buffer',
      type: 'buffer',
      startTime: new Date(`${todayStr}T11:00:00`),
      endTime: new Date(`${todayStr}T11:15:00`),
      day: today,
      color: '#94A3B8',
      isBuffer: true,
      order: 2,
    },
    {
      userId,
      title: 'Team Standup',
      type: 'event',
      startTime: new Date(`${todayStr}T11:15:00`),
      endTime: new Date(`${todayStr}T11:45:00`),
      day: today,
      color: '#F59E0B',
      isBuffer: false,
      order: 3,
    },
    {
      userId,
      title: 'Lunch Break',
      type: 'break',
      startTime: new Date(`${todayStr}T12:00:00`),
      endTime: new Date(`${todayStr}T13:00:00`),
      day: today,
      color: '#10B981',
      isBuffer: false,
      order: 4,
    },
    {
      userId,
      title: 'Email & Admin',
      type: 'task',
      startTime: new Date(`${todayStr}T13:00:00`),
      endTime: new Date(`${todayStr}T14:00:00`),
      day: today,
      color: '#8B5CF6',
      isBuffer: false,
      order: 5,
    },
    {
      userId,
      title: 'Afternoon Focus',
      type: 'focus',
      startTime: new Date(`${todayStr}T14:00:00`),
      endTime: new Date(`${todayStr}T16:00:00`),
      day: today,
      color: '#3B82F6',
      isBuffer: false,
      order: 6,
    },
  ];

  await prisma.timelineBlock.createMany({ data: blocks });
  console.log(`    Created ${blocks.length} timeline blocks`);
}

async function seedUserProgress(userId: string) {
  console.log('  📊 Creating user progress...');
  
  await prisma.userProgress.create({
    data: {
      userId,
      totalXp: 1250,
      tasksCompleted: 47,
      focusMinutes: 820,
      habitsLogged: 35,
      routinesCompleted: 12,
      currentStreak: 5,
      longestStreak: 14,
    },
  });

  // First ensure badges exist, then create user badges
  const badgeDefinitions = [
    { id: 'first_task', name: 'Task Starter', description: 'Complete your first task', icon: '✅', category: 'tasks', criteriaType: 'count', criteriaValue: 1, criteriaMetric: 'tasksCompleted', rarity: 'common' },
    { id: 'task_10', name: 'Task Master', description: 'Complete 10 tasks', icon: '🏆', category: 'tasks', criteriaType: 'count', criteriaValue: 10, criteriaMetric: 'tasksCompleted', rarity: 'uncommon' },
    { id: 'focus_60', name: 'Focus Initiate', description: 'Focus for 60 minutes', icon: '⏱️', category: 'focus', criteriaType: 'count', criteriaValue: 60, criteriaMetric: 'focusMinutes', rarity: 'common' },
    { id: 'habit_7', name: 'Week Warrior', description: 'Log habits for 7 days', icon: '📅', category: 'habits', criteriaType: 'count', criteriaValue: 7, criteriaMetric: 'habitsLogged', rarity: 'uncommon' },
  ];

  // Upsert badges
  for (const badge of badgeDefinitions) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      update: {},
      create: badge,
    });
  }

  // Create user badges
  await prisma.userBadge.createMany({
    data: [
      { userId, badgeId: 'first_task', earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { userId, badgeId: 'task_10', earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { userId, badgeId: 'focus_60', earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { userId, badgeId: 'habit_7', earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    ],
    skipDuplicates: true,
  });

  // Create XP history
  const xpEvents = [];
  for (let i = 1; i <= 20; i++) {
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - Math.floor(i / 3));
    timestamp.setHours(9 + (i % 10), i * 3, 0, 0);
    
    xpEvents.push({
      userId,
      amount: [10, 15, 20, 25, 30, 50, 10, 15, 10, 20][i % 10],
      source: ['task_complete', 'habit_log', 'focus_session', 'badge_earned'][i % 4],
      description: [
        'Completed task',
        'Logged habit',
        'Focus session completed',
        'Earned badge',
      ][i % 4],
      timestamp,
    });
  }

  await prisma.xPEvent.createMany({ data: xpEvents });
  console.log('    Created user progress, badges, and XP history');
}

async function seedMoodEntries(userId: string) {
  console.log('  😊 Creating mood entries...');
  
  const entries = [];
  
  for (let i = 0; i < 14; i++) {
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - i);
    timestamp.setHours(20, 0, 0, 0);
    
    entries.push({
      userId,
      moodLevel: 2 + Math.floor(Math.random() * 3), // 2-4
      energyLevel: 2 + Math.floor(Math.random() * 3),
      descriptor: ['calm', 'focused', 'tired', 'energized', 'stressed', 'happy'][Math.floor(Math.random() * 6)],
      timestamp,
    });
  }

  await prisma.moodEntry.createMany({ data: entries });
  console.log(`    Created ${entries.length} mood entries`);
}

async function seedWidgetPresets(userId: string) {
  console.log('  🧩 Creating widget presets...');
  
  await prisma.widgetPreset.createMany({
    data: [
      {
        userId,
        type: 'quick_add',
        title: 'Quick Add',
        config: {},
        order: 0,
        isPinned: true,
      },
      {
        userId,
        type: 'today_summary',
        title: 'Today',
        config: {},
        order: 1,
        isPinned: true,
      },
      {
        userId,
        type: 'pinned_list',
        title: 'Pinned Lists',
        config: { listIds: [`${userId}-inbox`, `${userId}-work`, `${userId}-personal`] },
        order: 2,
        isPinned: true,
      },
      {
        userId,
        type: 'habit_widget',
        title: 'Today\'s Habits',
        config: {},
        order: 3,
        isPinned: false,
      },
      {
        userId,
        type: 'focus_widget',
        title: 'Focus Timer',
        config: { defaultDuration: 25 },
        order: 4,
        isPinned: false,
      },
    ],
  });
  
  console.log('    Created widget presets');
}

// Run the seed
main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
