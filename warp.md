# BrainXP - ADHD Support Application

## Overview
BrainXP is a comprehensive ADHD support application built with React Native (Expo) and a Node.js/Express backend. The app provides evidence-based tools and features specifically designed to help individuals with ADHD manage tasks, build habits, improve focus, and track personal growth through gamification.

## Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native with Expo (~54.0)
- **Navigation**: Expo Router (file-based routing) + React Navigation
- **Language**: TypeScript (strict mode)
- **State Management**: 
  - Zustand (global state)
  - TanStack React Query (server state)
- **UI/Animation**:
  - React Native Reanimated (~4.1)
  - React Native Gesture Handler
  - Lottie for animations
  - Expo Linear Gradient
  - Custom glass/gradient card components
- **Forms**: React Hook Form + Zod validation
- **Storage**: AsyncStorage + Expo Secure Store
- **Other**: Expo AV (audio/video), Expo Notifications, Expo Haptics

### Backend (API Server)
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express 5.2
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL with Prisma ORM (59 models)
- **AI Integration**: Anthropic Claude SDK
- **Authentication**: Firebase Admin SDK
- **Security**: Helmet, CORS, express-rate-limit
- **Cache**: ioredis (Redis)
- **Testing**: tsx (test runner), Supertest
- **Development**: tsx watch mode

### Database
- **ORM**: Prisma 6.1
- **Database**: PostgreSQL
- **Models**: 59 comprehensive models covering all features
- **Schema Size**: 1,438 lines

## Project Structure

```
BrainXP/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                   # Authentication screens
│   ├── (onboarding)/             # User onboarding flow
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── tasks.tsx             # Task management
│   │   ├── habits.tsx            # Habit tracking
│   │   └── more.tsx              # Settings/More
│   ├── focus/                    # Focus mode & sessions
│   ├── habit/                    # Habit details
│   ├── routine/                  # Routines
│   ├── settings/                 # Settings screens
│   │   ├── notifications.tsx
│   │   ├── profile.tsx
│   │   ├── accessibility.tsx
│   │   └── security.tsx
│   ├── study/                    # Study tools (Quizlet-like)
│   │   ├── generate.tsx          # AI study set generation
│   │   ├── create.tsx
│   │   ├── quiz.tsx
│   │   └── review.tsx
│   ├── task/                     # Task details
│   ├── therapy/                  # CBT & mindfulness tools
│   ├── tools/                    # AI productivity tools
│   │   ├── time.tsx              # Time estimation
│   │   ├── flashcards.tsx
│   │   ├── compile.tsx           # Task breakdown
│   │   └── spoons.tsx            # Energy management
│   └── wellness/                 # Wellness tracking
│
├── src/                          # Shared source code
│   ├── components/               # Reusable components
│   │   ├── accessibility/        # Accessibility features
│   │   ├── ai/                   # AI coach & insights
│   │   ├── aiTools/              # Goblin.tools-inspired
│   │   ├── capture/              # Quick capture
│   │   ├── common/               # Common UI components
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── focus/                # Focus mode components
│   │   ├── gamification/         # XP, badges, particles
│   │   ├── habits/               # Habit tracking
│   │   ├── notes/                # Note-taking (NotebookLM-inspired)
│   │   ├── planning/             # Planning tools
│   │   ├── study/                # Study components
│   │   ├── tasks/                # Task components
│   │   ├── therapy/              # CBT & therapy tools
│   │   ├── ui/                   # Base UI components (GlassCard, etc.)
│   │   └── wellness/             # Mood & wellness
│   │
│   ├── contexts/                 # React contexts
│   │   ├── ThemeContext.tsx
│   │   └── AccessibilityContext.tsx
│   │
│   ├── stores/                   # Zustand state stores
│   │   ├── settingsStore.ts
│   │   ├── habitStore.ts
│   │   ├── mlStore.ts
│   │   └── routineStore.ts
│   │
│   ├── services/                 # API services & integrations
│   ├── types/                    # TypeScript type definitions
│   │   ├── task.ts
│   │   ├── habit.ts
│   │   ├── routine.ts
│   │   ├── focus.ts
│   │   ├── study.ts              # Quizlet-inspired types
│   │   ├── notes.ts              # NotebookLM-inspired types
│   │   ├── aiTools.ts            # Goblin.tools-inspired types
│   │   ├── therapy.ts            # CBT & therapy types
│   │   ├── timeline.ts
│   │   ├── upshift.ts
│   │   └── index.ts
│   │
│   ├── theme/                    # Design system
│   │   └── colors.ts             # ADHD-optimized colors
│   ├── utils/                    # Utility functions
│   └── data/                     # Static data/fixtures
│
├── backend/                      # Express API server
│   ├── src/
│   │   ├── controllers/          # (Currently empty - logic in routes)
│   │   ├── routes/               # API route handlers
│   │   │   ├── ai.ts             # AI coach/insights
│   │   │   ├── aiTools.ts        # Goblin.tools features
│   │   │   ├── analytics.ts      # Usage analytics
│   │   │   ├── capture.ts        # Quick capture
│   │   │   ├── focus.ts          # Focus sessions
│   │   │   ├── gamification.ts   # XP, badges, levels
│   │   │   ├── habits.ts         # Habit CRUD
│   │   │   ├── lessons.ts        # Psychoeducation
│   │   │   ├── mindmap.ts        # Mind mapping
│   │   │   ├── mlRoutes.ts       # Machine learning
│   │   │   ├── study.ts          # Study sets & quizzes
│   │   │   ├── tasks.ts          # Task CRUD
│   │   │   ├── timeline.ts       # Timeline blocks
│   │   │   └── tracking.ts       # Passive tracking
│   │   │
│   │   ├── services/             # Business logic services
│   │   │   ├── mlService.ts      # ML predictions
│   │   │   ├── transcription.ts  # Audio transcription
│   │   │   └── upshift.ts        # Upshift integration
│   │   │
│   │   ├── middleware/           # Express middleware
│   │   ├── lib/                  # Libraries (Prisma, Firebase)
│   │   ├── types/                # Backend type definitions
│   │   ├── utils/                # Backend utilities
│   │   ├── index.ts              # Server entry point
│   │   └── seed.ts               # Database seeding
│   │
│   ├── prisma/
│   │   └── schema.prisma         # 59 models, 1438 lines
│   ├── tests/                    # Backend tests
│   └── .env.example              # Environment variables template
│
├── assets/                       # Static assets (images, fonts)
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript config
├── app.json                      # Expo configuration
├── babel.config.js               # Babel configuration
├── metro.config.js               # Metro bundler config
└── jest.config.js                # Jest testing config
```

## Key Features

### 1. Task Management
- Inbox/GTD-style task organization
- Task prioritization (Eisenhower Matrix)
- Energy level tracking
- AI-powered task decomposition
- Subtasks and checklists
- Smart lists with filters
- Reminders (time & location-based)
- Recurring tasks

### 2. Habit Tracking
- Daily habit logging
- Streak tracking with armor system
- Visual progress indicators
- Gamification integration

### 3. Focus Tools
- Pomodoro-style focus sessions
- Focus time tracking
- Session history and analytics
- Integration with task work time

### 4. Study Tools (Quizlet-inspired)
- AI-powered study set generation
- Flashcards
- Quizzes with multiple question types
- Spaced repetition
- Study statistics

### 5. Note-Taking (NotebookLM-inspired)
- Rich text notes
- Note folders
- Document uploads
- AI-powered insights from notes

### 6. AI Productivity Tools (Goblin.tools-inspired)
- Task breakdown (Compile)
- Time estimation (Judge)
- Energy/spoons calculator
- Quick capture with AI processing

### 7. CBT & Therapy Tools
- Cognitive restructuring exercises
- Thought logs with cognitive distortion detection
- Mindfulness sessions
- Psychoeducation lessons
- tDCS session tracking

### 8. Timeline & Planning
- Visual timeline blocks
- Time blocking
- Schedule optimization
- Day planning

### 9. Gamification
- XP system with levels
- Badges and achievements
- Streak armor (protect streaks)
- Particle effects for celebrations
- Cosmetic rewards
- Party system (social features)

### 10. Wellness Tracking
- Mood logging
- Energy level tracking
- Trigger identification
- Contextual psychoeducation

### 11. Cognitive Profile
- Personalized ADHD assessment
- Focus pattern tracking
- Attention reports
- ML-powered predictions

### 12. Accessibility
- ADHD-optimized color palette
- Reduced motion options
- Haptic feedback
- Audio cues
- Simplified interfaces

## Database Schema Highlights

The Prisma schema includes 59 models covering:
- **User Management**: User, UserProgress, UserBadge, UserCosmetic
- **Tasks**: Task, Reminder, TaskChecklistItem, TaskList, SmartList
- **Habits**: Habit, HabitLog, StreakArmor
- **Focus**: FocusSession, FocusSessionPlan
- **Timeline**: TimelineBlock
- **Therapy**: CBTIntervention, ThoughtLog, CognitiveProfile, MindfulnessSession, TDCSSession
- **Study**: StudySet, Flashcard, Quiz, QuizAttempt
- **Notes**: Note, NoteFolder, Document
- **AI Tools**: AIToolUsage, CaptureItem
- **Gamification**: XPEvent, Badge, PartyMember
- **Tracking**: PassiveTrackingEvent, AttentionReport
- **Education**: Lesson, LessonReflection, TriggeredEducation
- **Mind Mapping**: MindMapNode, MindMapEdge
- **Daily Tools**: DailyList, Thing
- **Wellness**: MoodEntry, NudgePreference

## Development Commands

### Frontend
```bash
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run web           # Run on web
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run typecheck     # TypeScript type checking
```

### Backend
```bash
npm run dev           # Start dev server with hot reload
npm run build         # Build TypeScript to dist/
npm start             # Run production build
npm test              # Run tests
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio GUI
npm run db:seed       # Seed database
```

## Environment Setup

### Backend Environment Variables
See `backend/.env.example` for required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: API server port (default: 3000)
- `CORS_ORIGIN`: Allowed CORS origins
- `ANTHROPIC_API_KEY`: Claude API key
- Firebase Admin SDK credentials
- Redis connection (optional)

## Design Philosophy

### ADHD-Friendly Design Principles
1. **Reduced Cognitive Load**: Clear hierarchies, minimal clutter
2. **Visual Feedback**: Animations, haptics, particle effects
3. **Immediate Gratification**: XP, streaks, instant feedback
4. **Flexible Organization**: Multiple ways to organize tasks/data
5. **Gentle Nudges**: Non-intrusive reminders and suggestions
6. **Forgiving UX**: Easy undo, streak armor, no punishment
7. **Energy Awareness**: Spoons system, energy-based task selection
8. **Dopamine Optimization**: Gamification without manipulation

### Color System
- **ADHD Palette**: Calm, focused colors to reduce overstimulation
- **Semantic Colors**: Clear meaning (success, warning, error)
- **Gradient System**: Beautiful, attention-grabbing accents
- **Dark/Light Themes**: Respects user preference

## API Architecture

### REST API Endpoints
- `/api/tasks` - Task management
- `/api/habits` - Habit tracking
- `/api/focus` - Focus sessions
- `/api/timeline` - Timeline blocks
- `/api/study` - Study sets & quizzes
- `/api/ai` - AI coach & insights
- `/api/aiTools` - Goblin.tools features
- `/api/capture` - Quick capture
- `/api/gamification` - XP, badges, levels
- `/api/mindmap` - Mind mapping
- `/api/tracking` - Passive tracking
- `/api/analytics` - Usage analytics
- `/api/lessons` - Psychoeducation

### Authentication
Firebase Authentication with JWT tokens validated via Firebase Admin SDK

### Rate Limiting
Express rate limiter configured to prevent abuse

## Testing

### Frontend Testing
- Jest configured with jest-expo
- React Native Testing Library
- Component and integration tests

### Backend Testing
- tsx test runner (Node.js native test runner)
- Supertest for API testing
- Integration tests for routes

## Performance Considerations
- React Native Reanimated for 60fps animations
- Optimized re-renders with Zustand
- TanStack Query for efficient server state caching
- Lazy loading for heavy screens
- Image optimization via Expo

## Future Enhancements
Based on the comprehensive schema, planned features include:
- Body doubling (virtual coworking)
- Widget system (customizable dashboard)
- Party/social features (accountability partners)
- Advanced ML predictions (task completion, focus patterns)
- Passive app usage tracking (attention analysis)
- Enhanced psychoeducation (contextual learning)

## Git Branch
Current branch: `claude/adhd-support-app-01LKShohtjfyrCoCn7yx1GTU`

## Notes
- Frontend entry point: `index.ts` → Expo Router (app/_layout.tsx)
- Backend entry point: `backend/src/index.ts`
- No README.md exists yet in root (this warp.md serves as documentation)
- Both frontend and backend are fully TypeScript with strict mode
- Expo new architecture enabled for better performance
