# BrainXP Style Guide & Coding Principles

This document outlines coding conventions, best practices, and ethical guidelines for the BrainXP project - an ADHD support application that prioritizes user wellbeing and accessibility.

---

## Table of Contents

1. [Core Values & Ethics](#core-values--ethics)
2. [General Coding Principles](#general-coding-principles)
3. [TypeScript Guidelines](#typescript-guidelines)
4. [Frontend Guidelines (React Native + Expo)](#frontend-guidelines-react-native--expo)
5. [Backend Guidelines (Node.js + Express)](#backend-guidelines-nodejs--express)
6. [Database & Prisma Guidelines](#database--prisma-guidelines)
7. [AI & ML Ethics](#ai--ml-ethics)
8. [Accessibility & ADHD-Friendly Design](#accessibility--adhd-friendly-design)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Security & Privacy](#security--privacy)
11. [Performance & Optimization](#performance--optimization)
12. [Documentation](#documentation)

---

## Core Values & Ethics

### 1. User Wellbeing First
- **Never manipulate**: Gamification should motivate, not exploit dopamine systems
- **No dark patterns**: Be transparent about features, never trick users into actions
- **Respect boundaries**: Make it easy to opt-out, pause, or reduce engagement
- **Fail gracefully**: Errors should never punish users (e.g., streak armor protects streaks)

### 2. Mental Health Sensitivity
- **Avoid judgment**: Language should be encouraging, never shaming
- **Respect neurodiversity**: ADHD is not a deficit, design for different cognitive styles
- **Evidence-based**: Features should be grounded in research, not stereotypes
- **Professional boundaries**: The app is a tool, not a replacement for professional care

### 3. Privacy & Data Ethics
- **Minimize data collection**: Only collect what's necessary for features
- **Transparent usage**: Users should know what data is collected and why
- **User ownership**: Users should be able to export or delete all their data
- **Secure by default**: Protect sensitive health and behavioral data

### 4. Inclusive Design
- **Accessibility is non-negotiable**: WCAG 2.1 AA minimum standard
- **Multiple pathways**: Provide alternative ways to accomplish tasks
- **Configurable experience**: Allow users to customize for their needs
- **Test with real users**: Include people with ADHD in the design process

---

## General Coding Principles

### Code Quality
```typescript
// ✅ GOOD: Clear, descriptive, self-documenting
const calculateHabitStreakWithArmor = (logs: HabitLog[], armorCount: number): number => {
  // Implementation
};

// ❌ BAD: Unclear, abbreviated
const calcHS = (l: any[], a: number) => {
  // Implementation
};
```

### Naming Conventions

**Files & Folders:**
- **Components**: `PascalCase.tsx` → `HabitCard.tsx`, `TaskList.tsx`
- **Screens**: `PascalCase.tsx` → `FocusSessionScreen.tsx`
- **Utilities**: `camelCase.ts` → `dateUtils.ts`, `animations.ts`
- **Types**: `camelCase.ts` or `PascalCase.ts` → `types/task.ts`
- **Hooks**: `camelCase.ts` → `useHabitStreak.ts`, `useTaskFilters.ts`
- **Stores**: `camelCase.ts` → `taskStore.ts`, `habitStore.ts`
- **Constants**: `UPPER_SNAKE_CASE.ts` → `API_ENDPOINTS.ts`

**Variables & Functions:**
```typescript
// Variables: camelCase
const userProgress = getUserProgress();
const isTaskCompleted = task.status === 'done';

// Functions: camelCase, verb-based
const fetchUserHabits = async () => {};
const calculateXPReward = (action: string) => {};
const toggleTaskCompletion = (taskId: string) => {};

// Constants: UPPER_SNAKE_CASE
const MAX_STREAK_ARMOR = 3;
const DEFAULT_FOCUS_DURATION = 25;
const API_BASE_URL = process.env.API_URL;

// Types/Interfaces: PascalCase
interface Task {
  id: string;
  title: string;
}

type TaskStatus = 'inbox' | 'todo' | 'in_progress' | 'done';
```

### Function Guidelines

```typescript
// ✅ GOOD: Single responsibility, clear purpose
const calculateTaskXP = (task: Task): number => {
  const baseXP = 10;
  const priorityMultiplier = getPriorityMultiplier(task.priority);
  const completionBonus = task.subtasks?.every(s => s.isCompleted) ? 5 : 0;
  
  return baseXP * priorityMultiplier + completionBonus;
};

// ❌ BAD: Multiple responsibilities, unclear
const doStuff = (task: any) => {
  const xp = 10;
  if (task.priority === 'urgent_important') xp *= 2;
  // Also updates UI
  // Also makes API call
  // Also logs analytics
};
```

**Rules:**
- Keep functions under 50 lines (aim for 20)
- One level of abstraction per function
- Max 3 parameters (use objects for more)
- Avoid side effects in pure functions
- Use early returns to reduce nesting

```typescript
// ✅ GOOD: Early returns, flat structure
const validateTask = (task: Task): ValidationResult => {
  if (!task.title.trim()) {
    return { valid: false, error: 'Title is required' };
  }
  
  if (task.title.length > 200) {
    return { valid: false, error: 'Title too long' };
  }
  
  return { valid: true };
};

// ❌ BAD: Nested conditions
const validateTask = (task: Task) => {
  if (task.title.trim()) {
    if (task.title.length <= 200) {
      return { valid: true };
    } else {
      return { valid: false, error: 'Title too long' };
    }
  } else {
    return { valid: false, error: 'Title is required' };
  }
};
```

### DRY (Don't Repeat Yourself)

```typescript
// ✅ GOOD: Reusable utility
const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffInDays = differenceInDays(now, date);
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return format(date, 'MMM d, yyyy');
};

// Use everywhere
<Text>{formatRelativeDate(task.dueDate)}</Text>
<Text>{formatRelativeDate(habit.lastCompleted)}</Text>

// ❌ BAD: Repeated logic
// Component A
const formatDate = (date: Date) => {
  // Same logic repeated
};

// Component B
const formatDate = (date: Date) => {
  // Same logic repeated again
};
```

### Comments

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Using setTimeout because React Native Reanimated doesn't support
// synchronous state updates during gesture handlers
setTimeout(() => {
  onComplete();
}, 200);

// Complex algorithm explanation
// Eisenhower Matrix: urgent_important (P1) > important (P2) > urgent (P3) > low (P4)
const priorityOrder = ['urgent_important', 'important', 'urgent', 'low', 'none'];

// ❌ BAD: Obvious comments
// Set the title
task.title = newTitle;

// Loop through tasks
tasks.forEach(task => { });
```

---

## TypeScript Guidelines

### Type Safety

```typescript
// ✅ GOOD: Strict typing
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: Date | null;
  priority: TaskPriority;
}

type TaskStatus = 'inbox' | 'todo' | 'in_progress' | 'waiting' | 'done' | 'abandoned';
type TaskPriority = 'urgent_important' | 'important' | 'urgent' | 'low' | 'none';

const updateTask = (taskId: string, updates: Partial<Task>): Promise<Task> => {
  // Implementation
};

// ❌ BAD: Loose typing
const updateTask = (id: any, data: any): any => {
  // Implementation
};
```

### Avoid `any`

```typescript
// ✅ GOOD: Proper typing
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const fetchTasks = async (): Promise<ApiResponse<Task[]>> => {
  const response = await api.get<ApiResponse<Task[]>>('/tasks');
  return response.data;
};

// ⚠️ ACCEPTABLE: Unknown for true unknowns, then narrow
const parseApiResponse = (response: unknown): Task[] => {
  if (!isApiResponse(response)) {
    throw new Error('Invalid API response');
  }
  return response.data;
};

// ❌ BAD: Using any
const fetchTasks = async (): Promise<any> => {
  const response = await api.get('/tasks');
  return response.data;
};
```

### Enums vs Union Types

```typescript
// ✅ PREFERRED: String literal unions (better for serialization)
type FocusSessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'abandoned';

// ⚠️ ACCEPTABLE: Enums for internal logic only
enum PriorityLevel {
  URGENT_IMPORTANT = 'urgent_important',
  IMPORTANT = 'important',
  URGENT = 'urgent',
  LOW = 'low',
  NONE = 'none',
}
```

### Type Guards

```typescript
// ✅ GOOD: Type guards for runtime safety
const isTask = (obj: unknown): obj is Task => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'status' in obj
  );
};

const processData = (data: unknown) => {
  if (isTask(data)) {
    // TypeScript knows data is Task here
    console.log(data.title);
  }
};
```

---

## Frontend Guidelines (React Native + Expo)

### Project Structure

```
app/                          # Expo Router screens
  (auth)/                     # Auth screens (login, signup)
  (onboarding)/               # Onboarding flow
  (tabs)/                     # Main tab navigation
  focus/                      # Focus feature screens
  study/                      # Study feature screens
  tools/                      # AI tools screens
  settings/                   # Settings screens

src/
  components/                 # Reusable components
    ui/                       # Base UI (GlassCard, AnimatedButton)
    tasks/                    # Task-specific components
    habits/                   # Habit-specific components
    [feature]/                # Feature-specific components
  
  contexts/                   # React contexts
  stores/                     # Zustand stores
  hooks/                      # Custom hooks
  services/                   # API services
  utils/                      # Utility functions
  types/                      # TypeScript types
  theme/                      # Design system
  data/                       # Static data/constants
```

### Component Guidelines

```typescript
// ✅ GOOD: Functional component with proper typing
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onPress?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onComplete, 
  onPress 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleComplete = useCallback(() => {
    onComplete(task.id);
  }, [task.id, onComplete]);
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Text style={styles.title}>{task.title}</Text>
      <TouchableOpacity onPress={handleComplete}>
        <Text>✓</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Component Rules:**
- One component per file
- Max 300 lines per component (split if larger)
- Props interface at the top
- Destructure props in function signature
- Use `React.FC<PropsType>` or function declaration
- StyleSheet at bottom of file
- Export component as named export

### Hooks Guidelines

```typescript
// ✅ GOOD: Custom hook with proper cleanup
import { useState, useEffect, useCallback } from 'react';
import { useTaskStore } from '@/stores/taskStore';

interface UseTaskFiltersOptions {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  dueDateRange?: DateRange;
}

export const useTaskFilters = (options: UseTaskFiltersOptions) => {
  const tasks = useTaskStore(state => state.tasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  const applyFilters = useCallback(() => {
    let result = tasks;
    
    if (options.status) {
      result = result.filter(t => options.status!.includes(t.status));
    }
    
    if (options.priority) {
      result = result.filter(t => options.priority!.includes(t.priority));
    }
    
    setFilteredTasks(result);
  }, [tasks, options]);
  
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);
  
  return { filteredTasks, applyFilters };
};
```

**Hook Rules:**
- Prefix with `use`
- One hook per file
- Include cleanup in useEffect when needed
- Return object with named properties, not array
- Document dependencies clearly

### State Management (Zustand)

```typescript
// ✅ GOOD: Zustand store with TypeScript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '@/types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,
      
      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          const tasks = await taskService.fetchAll();
          set({ tasks, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch tasks',
            isLoading: false 
          });
        }
      },
      
      addTask: async (taskData) => {
        try {
          const newTask = await taskService.create(taskData);
          set(state => ({ tasks: [...state.tasks, newTask] }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add task' });
        }
      },
      
      updateTask: async (id, updates) => {
        try {
          const updatedTask = await taskService.update(id, updates);
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update task' });
        }
      },
      
      deleteTask: async (id) => {
        try {
          await taskService.delete(id);
          set(state => ({
            tasks: state.tasks.filter(t => t.id !== id)
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tasks: state.tasks }), // Only persist tasks
    }
  )
);
```

### Animation Guidelines (Reanimated)

```typescript
// ✅ GOOD: Smooth, accessible animations
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Spring configs for consistent feel
export const springConfigs = {
  gentle: { damping: 20, stiffness: 90 },
  snappy: { damping: 15, stiffness: 150 },
  bouncy: { damping: 10, stiffness: 100 },
  wobbly: { damping: 8, stiffness: 120 },
};

const AnimatedButton: React.FC<Props> = ({ onPress, children }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95, springConfigs.snappy);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.bouncy);
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};
```

**Animation Rules:**
- Respect `prefers-reduced-motion` (check accessibility settings)
- Keep animations under 300ms for interactions
- Use spring animations for natural feel
- Avoid jarring or distracting animations (ADHD consideration)
- Always provide non-animated fallback

### Styling Guidelines

```typescript
// ✅ GOOD: Organized, reusable styles
import { StyleSheet } from 'react-native';
import { colors, shadows, spacing } from '@/theme';

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  
  // Components
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.md,
  },
  
  // Typography
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  
  // States
  cardPressed: {
    opacity: 0.7,
  },
  
  cardDisabled: {
    opacity: 0.5,
  },
});
```

**Styling Rules:**
- Use theme system for colors, spacing, typography
- Group related styles together
- Use semantic naming (card, title) not visual (blueBox, bigText)
- Avoid inline styles unless truly dynamic
- Use StyleSheet.create for performance

---

## Backend Guidelines (Node.js + Express)

### Project Structure

```
backend/
  src/
    controllers/        # Business logic (currently in routes)
    routes/            # API route definitions
      index.ts         # Route aggregator
      tasks.ts         # Task endpoints
      habits.ts        # Habit endpoints
    
    services/          # External services, complex business logic
      mlService.ts     # ML predictions
      aiService.ts     # Claude AI integration
    
    middleware/        # Express middleware
      auth.ts          # Firebase auth verification
      validation.ts    # Request validation
      errorHandler.ts  # Global error handling
    
    lib/              # Libraries & config
      prisma.ts       # Prisma client
      firebase.ts     # Firebase admin
    
    types/            # TypeScript types
    utils/            # Utility functions
    
    index.ts          # Server entry point
    seed.ts           # Database seeding
  
  prisma/
    schema.prisma     # Database schema
  
  tests/             # Test files
```

### Route Organization

```typescript
// ✅ GOOD: RESTful, organized routes
// routes/tasks.ts
import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { validateTask } from '../middleware/validation';
import { taskController } from '../controllers/taskController';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// GET /api/tasks - List all tasks
router.get('/', taskController.listTasks);

// GET /api/tasks/:id - Get single task
router.get('/:id', taskController.getTask);

// POST /api/tasks - Create task
router.post('/', validateTask, taskController.createTask);

// PATCH /api/tasks/:id - Update task
router.patch('/:id', validateTask, taskController.updateTask);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', taskController.deleteTask);

// POST /api/tasks/:id/complete - Complete task
router.post('/:id/complete', taskController.completeTask);

export default router;
```

### Controller Pattern

```typescript
// ✅ GOOD: Controller with proper error handling
// controllers/taskController.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/errors';
import { calculateTaskXP } from '../utils/gamification';

export const taskController = {
  listTasks: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id; // Set by auth middleware
      const { status, priority } = req.query;
      
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          ...(status && { status: status as string }),
          ...(priority && { priority: priority as string }),
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
        ],
        include: {
          subtasks: true,
          reminders: true,
        },
      });
      
      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  },
  
  createTask: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const taskData = req.body;
      
      const task = await prisma.task.create({
        data: {
          ...taskData,
          userId,
        },
      });
      
      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully',
      });
    } catch (error) {
      next(error);
    }
  },
  
  completeTask: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      // Verify ownership
      const task = await prisma.task.findFirst({
        where: { id, userId },
      });
      
      if (!task) {
        throw new ApiError(404, 'Task not found');
      }
      
      if (task.status === 'done') {
        throw new ApiError(400, 'Task already completed');
      }
      
      // Update task and award XP
      const [updatedTask, xpEvent] = await prisma.$transaction([
        prisma.task.update({
          where: { id },
          data: {
            status: 'done',
            completedAt: new Date(),
          },
        }),
        prisma.xPEvent.create({
          data: {
            userId,
            amount: calculateTaskXP(task),
            source: 'task_completion',
            sourceId: id,
          },
        }),
      ]);
      
      res.json({
        success: true,
        data: {
          task: updatedTask,
          xpEarned: xpEvent.amount,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
```

### Error Handling

```typescript
// ✅ GOOD: Custom error classes and global handler
// utils/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  // Known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  }
  
  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Resource already exists',
      });
    }
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
};
```

### API Response Format

```typescript
// ✅ GOOD: Consistent response format
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

// Success response
res.json({
  success: true,
  data: { task },
  message: 'Task created successfully',
});

// Error response
res.status(400).json({
  success: false,
  error: 'Validation failed',
  details: {
    title: 'Title is required',
  },
});

// List response with pagination
res.json({
  success: true,
  data: {
    items: tasks,
    pagination: {
      page: 1,
      pageSize: 20,
      total: 100,
      hasMore: true,
    },
  },
});
```

### Environment Variables

```typescript
// ✅ GOOD: Type-safe environment variables
// utils/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);

// Usage
import { env } from './utils/env';
const PORT = env.PORT;
```

---

## Database & Prisma Guidelines

### Schema Organization

```prisma
// ✅ GOOD: Well-organized schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// === Core Models ===

model User {
  id          String   @id @default(uuid())
  firebaseUid String   @unique
  email       String   @unique
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  tasks       Task[]
  habits      Habit[]
  
  @@map("users")
  @@index([email])
}

model Task {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title       String
  description String?
  status      String   @default("inbox")
  priority    String   @default("none")
  
  dueDate     DateTime?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("tasks")
  @@index([userId])
  @@index([status])
  @@index([dueDate])
}
```

**Schema Rules:**
- Group related models together
- Use `@@map("table_name")` for table names (snake_case)
- Add indexes for foreign keys and frequent queries
- Use `onDelete: Cascade` for dependent records
- Document complex relationships with comments
- Use explicit relation names for clarity

### Query Patterns

```typescript
// ✅ GOOD: Efficient queries with proper error handling
import { prisma } from '../lib/prisma';

// Single record with relations
const getTaskWithDetails = async (taskId: string, userId: string) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId, // Always filter by user for security
    },
    include: {
      subtasks: {
        orderBy: { order: 'asc' },
      },
      reminders: {
        where: { sent: false },
      },
      checklistItems: true,
    },
  });
  
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  
  return task;
};

// List with filtering and pagination
const listTasks = async (
  userId: string,
  filters: TaskFilters,
  pagination: Pagination
) => {
  const { status, priority, search } = filters;
  const { page = 1, pageSize = 20 } = pagination;
  
  const where = {
    userId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    }),
    prisma.task.count({ where }),
  ]);
  
  return {
    items: tasks,
    pagination: {
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    },
  };
};

// Transactions for atomic operations
const completeHabit = async (habitId: string, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Create habit log
    const log = await tx.habitLog.create({
      data: {
        habitId,
        completed: true,
        logDate: new Date(),
      },
    });
    
    // 2. Update habit streak
    const habit = await tx.habit.update({
      where: { id: habitId },
      data: {
        currentStreak: { increment: 1 },
        longestStreak: { increment: 1 },
        lastCompleted: new Date(),
      },
    });
    
    // 3. Award XP
    const xpEvent = await tx.xPEvent.create({
      data: {
        userId,
        amount: 15,
        source: 'habit_completion',
        sourceId: habitId,
      },
    });
    
    return { log, habit, xpEvent };
  });
};
```

**Query Rules:**
- Always include `userId` in where clauses for security
- Use transactions for related operations
- Include only necessary relations (avoid over-fetching)
- Add pagination for lists
- Use `findFirst` instead of `findUnique` when filtering by multiple fields
- Handle not found cases explicitly

---

## AI & ML Ethics

### Responsible AI Usage

```typescript
// ✅ GOOD: Transparent AI usage with fallbacks
import Anthropic from '@anthropic-ai/sdk';

interface AITaskBreakdown {
  subtasks: string[];
  estimatedMinutes: number[];
  confidence: number;
  wasAIGenerated: true;
}

const breakdownTaskWithAI = async (
  taskTitle: string,
  taskDescription?: string
): Promise<AITaskBreakdown> => {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Break down this task into 3-5 manageable subtasks. 
Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}

Be specific and actionable. Each subtask should be completable in under 30 minutes.
Respond in JSON format with: { subtasks: string[], estimatedMinutes: number[] }`,
      }],
    });
    
    const response = JSON.parse(message.content[0].text);
    
    // Track AI usage for transparency
    await prisma.aIToolUsage.create({
      data: {
        userId,
        tool: 'task_breakdown',
        input: taskTitle,
        output: JSON.stringify(response),
        successful: true,
      },
    });
    
    return {
      ...response,
      confidence: 0.85,
      wasAIGenerated: true,
    };
  } catch (error) {
    console.error('AI task breakdown failed:', error);
    
    // Fallback: simple heuristic
    return {
      subtasks: [
        'Plan the approach',
        'Complete the main work',
        'Review and finalize',
      ],
      estimatedMinutes: [10, 30, 10],
      confidence: 0.3,
      wasAIGenerated: false,
    };
  }
};
```

**AI Ethics Rules:**
1. **Transparency**: Always indicate when content is AI-generated
2. **User Control**: Users should be able to edit or reject AI suggestions
3. **Privacy**: Never send personal health data to AI without explicit consent
4. **Fallbacks**: Always have non-AI alternatives
5. **Monitoring**: Track AI usage and errors for quality control
6. **Bias Awareness**: Test AI features with diverse user profiles
7. **No Manipulation**: AI should assist, not manipulate behavior
8. **Data Retention**: Don't store AI interactions longer than necessary

### AI Feature Checklist

Before implementing any AI feature:

- [ ] Is it genuinely helpful or just "AI for AI's sake"?
- [ ] Do users understand they're interacting with AI?
- [ ] Can users easily override or ignore AI suggestions?
- [ ] Is there a fallback if AI fails?
- [ ] Have we tested for harmful outputs?
- [ ] Does it respect user privacy?
- [ ] Is it accessible to all users (including those who don't want AI)?

---

## Accessibility & ADHD-Friendly Design

### ADHD-Specific Guidelines

```typescript
// ✅ GOOD: ADHD-friendly component design
interface TaskCardProps {
  task: Task;
  // Allow users to customize information density
  viewMode: 'minimal' | 'comfortable' | 'detailed';
  // Reduce cognitive load with clear priority
  showPriorityIndicator: boolean;
  // Visual anchors for scanning
  showIconBadges: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  viewMode = 'comfortable',
  showPriorityIndicator = true,
  showIconBadges = true,
}) => {
  // Use colors sparingly and meaningfully
  const priorityColor = semanticColors.priority[task.priority];
  
  return (
    <GlassCard
      // Consistent visual hierarchy
      style={styles.card}
      // Generous touch targets (min 44x44pt)
      accessibilityRole="button"
      accessible
    >
      {/* Clear visual grouping */}
      <View style={styles.header}>
        {showPriorityIndicator && (
          <View 
            style={[styles.priorityDot, { backgroundColor: priorityColor }]}
            accessibilityLabel={`Priority: ${task.priority}`}
          />
        )}
        
        {/* Large, readable text */}
        <Text style={styles.title} numberOfLines={viewMode === 'minimal' ? 1 : 3}>
          {task.title}
        </Text>
      </View>
      
      {/* Progressive disclosure - show details only when needed */}
      {viewMode !== 'minimal' && (
        <View style={styles.metadata}>
          {task.dueDate && (
            <DueDateChip 
              date={task.dueDate}
              // Use relative time for easier comprehension
              format="relative"
            />
          )}
          
          {showIconBadges && task.subtasks && (
            <IconBadge 
              icon="checklist"
              count={task.subtasks.length}
              accessibilityLabel={`${task.subtasks.length} subtasks`}
            />
          )}
        </View>
      )}
    </GlassCard>
  );
};
```

**ADHD Design Principles:**

1. **Reduce Cognitive Load**
   - One primary action per screen
   - Clear visual hierarchy
   - Consistent patterns throughout app
   - Progressive disclosure of information

2. **Visual Clarity**
   - Generous whitespace
   - Clear grouping of related items
   - Meaningful use of color (not decoration)
   - High contrast text (WCAG AA minimum)

3. **Minimize Distractions**
   - Respect reduced motion preferences
   - Avoid auto-playing animations
   - No unexpected popups or interruptions
   - Focus mode with minimal UI

4. **Support Different Working Styles**
   - Multiple views (list, kanban, calendar)
   - Customizable information density
   - Different sorting/filtering options
   - Both quick capture and detailed planning

5. **Forgiving UX**
   - Easy undo for all actions
   - Confirm before destructive actions
   - Auto-save everything
   - Streak armor to prevent demotivation

### Accessibility Implementation

```typescript
// ✅ GOOD: Accessible component with proper ARIA
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

const HabitCheckbox: React.FC<HabitCheckboxProps> = ({
  habit,
  isChecked,
  onToggle,
}) => {
  const handleToggle = async () => {
    // Haptic feedback for confirmation
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };
  
  return (
    <TouchableOpacity
      onPress={handleToggle}
      // Accessibility properties
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked }}
      accessibilityLabel={habit.name}
      accessibilityHint={isChecked ? 'Unmark as complete' : 'Mark as complete'}
      // Minimum touch target size
      style={styles.touchTarget}
    >
      <View style={[
        styles.checkbox,
        isChecked && styles.checkboxChecked,
      ]}>
        {isChecked && <CheckIcon color={colors.white} />}
      </View>
      <Text style={styles.label}>{habit.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[400],
  },
  checkboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  label: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
  },
});
```

**Accessibility Checklist:**

- [ ] All interactive elements have min 44x44pt touch target
- [ ] Color is not the only means of conveying information
- [ ] Text contrast ratio meets WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] All images have `accessibilityLabel`
- [ ] All interactive elements have proper `accessibilityRole`
- [ ] Form inputs have labels and error messages
- [ ] Keyboard navigation works (for web)
- [ ] Screen reader tested with VoiceOver/TalkBack
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Focus indicators are visible

---

## Testing & Quality Assurance

### Frontend Testing (Jest + React Native Testing Library)

```typescript
// ✅ GOOD: Comprehensive component test
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task } from '@/types';

const mockTask: Task = {
  id: '1',
  userId: 'user1',
  title: 'Complete project proposal',
  description: 'Write and submit Q4 project proposal',
  status: 'todo',
  priority: 'urgent_important',
  dueDate: new Date('2025-12-20'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TaskCard', () => {
  it('renders task title and description', () => {
    const { getByText } = render(
      <TaskCard task={mockTask} onPress={() => {}} onComplete={() => {}} />
    );
    
    expect(getByText('Complete project proposal')).toBeTruthy();
  });
  
  it('shows priority indicator for high-priority tasks', () => {
    const { getByTestId } = render(
      <TaskCard task={mockTask} onPress={() => {}} onComplete={() => {}} />
    );
    
    const priorityDot = getByTestId('priority-indicator');
    expect(priorityDot).toBeTruthy();
  });
  
  it('calls onComplete when checkbox is pressed', async () => {
    const onComplete = jest.fn();
    const { getByRole } = render(
      <TaskCard task={mockTask} onPress={() => {}} onComplete={onComplete} />
    );
    
    const checkbox = getByRole('checkbox');
    fireEvent.press(checkbox);
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(mockTask.id);
    });
  });
  
  it('is accessible', () => {
    const { getByRole, getByLabelText } = render(
      <TaskCard task={mockTask} onPress={() => {}} onComplete={() => {}} />
    );
    
    expect(getByRole('button')).toBeTruthy();
    expect(getByLabelText(/complete project proposal/i)).toBeTruthy();
  });
});

// Custom hook testing
import { renderHook, act } from '@testing-library/react-hooks';
import { useTaskFilters } from '@/hooks/useTaskFilters';

describe('useTaskFilters', () => {
  it('filters tasks by status', () => {
    const tasks = [
      { ...mockTask, status: 'todo' },
      { ...mockTask, id: '2', status: 'done' },
    ];
    
    const { result } = renderHook(() => 
      useTaskFilters(tasks, { status: ['todo'] })
    );
    
    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].status).toBe('todo');
  });
});
```

### Backend Testing (tsx + Supertest)

```typescript
// ✅ GOOD: API integration test
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/lib/prisma';

describe('Task API', () => {
  let authToken: string;
  let userId: string;
  
  beforeEach(async () => {
    // Create test user and get auth token
    const user = await prisma.user.create({
      data: {
        firebaseUid: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    userId = user.id;
    authToken = 'test-token'; // Mock Firebase token
  });
  
  afterEach(async () => {
    // Clean up test data
    await prisma.task.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });
  
  test('GET /api/tasks returns user tasks', async () => {
    // Arrange
    await prisma.task.create({
      data: {
        userId,
        title: 'Test task',
        status: 'todo',
      },
    });
    
    // Act
    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    // Assert
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.length, 1);
    assert.strictEqual(response.body.data[0].title, 'Test task');
  });
  
  test('POST /api/tasks creates new task', async () => {
    const taskData = {
      title: 'New task',
      description: 'Task description',
      priority: 'important',
    };
    
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send(taskData)
      .expect(201);
    
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.title, 'New task');
    
    // Verify in database
    const task = await prisma.task.findFirst({
      where: { userId, title: 'New task' },
    });
    assert.ok(task);
  });
  
  test('POST /api/tasks/:id/complete awards XP', async () => {
    const task = await prisma.task.create({
      data: {
        userId,
        title: 'Task to complete',
        status: 'todo',
      },
    });
    
    const response = await request(app)
      .post(`/api/tasks/${task.id}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    assert.strictEqual(response.body.data.task.status, 'done');
    assert.ok(response.body.data.xpEarned > 0);
  });
  
  test('returns 404 for non-existent task', async () => {
    const response = await request(app)
      .get('/api/tasks/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
    
    assert.strictEqual(response.body.success, false);
  });
});
```

**Testing Rules:**
- Test behavior, not implementation
- Use descriptive test names
- Arrange-Act-Assert pattern
- One assertion per test (when possible)
- Test edge cases and error states
- Mock external services (Firebase, Claude AI)
- Clean up test data after each test

---

## Security & Privacy

### Authentication & Authorization

```typescript
// ✅ GOOD: Secure auth middleware
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { ApiError } from '../utils/errors';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firebaseUid: string;
    email: string;
  };
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'No authorization token provided');
    }
    
    const token = authHeader.substring(7);
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: { id: true, firebaseUid: true, email: true },
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(401, 'Invalid or expired token'));
    }
  }
};

// Resource ownership verification
export const verifyTaskOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const taskId = req.params.id;
    const userId = req.user!.id;
    
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });
    
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
```

### Data Privacy

```typescript
// ✅ GOOD: Privacy-respecting data handling
// Never log sensitive data
const logApiRequest = (req: Request) => {
  console.log({
    method: req.method,
    path: req.path,
    // ❌ DON'T: body: req.body (may contain sensitive data)
    userId: req.user?.id, // Only log user ID, not email or name
    timestamp: new Date().toISOString(),
  });
};

// Sanitize user data before sending to AI
const sanitizeForAI = (task: Task): string => {
  // Remove personally identifiable information
  return `Task: ${task.title}`;
  // ❌ DON'T include: description, notes, user-specific context
};

// Allow users to export their data
export const exportUserData = async (userId: string) => {
  const [tasks, habits, notes, sessions] = await Promise.all([
    prisma.task.findMany({ where: { userId } }),
    prisma.habit.findMany({ where: { userId } }),
    prisma.note.findMany({ where: { userId } }),
    prisma.focusSession.findMany({ where: { userId } }),
  ]);
  
  return {
    exportedAt: new Date().toISOString(),
    tasks,
    habits,
    notes,
    sessions,
    // Include everything the user created
  };
};

// Allow users to delete their data (GDPR compliance)
export const deleteUserData = async (userId: string) => {
  // Prisma cascade deletes will handle related records
  await prisma.user.delete({ where: { id: userId } });
};
```

### Input Validation

```typescript
// ✅ GOOD: Zod validation middleware
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const taskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
  description: z.string().max(2000).optional(),
  status: z.enum(['inbox', 'todo', 'in_progress', 'waiting', 'done', 'abandoned'])
    .default('inbox'),
  priority: z.enum(['urgent_important', 'important', 'urgent', 'low', 'none'])
    .default('none'),
  dueDate: z.string().datetime().optional(),
  estimatedMinutes: z.number().int().positive().max(1440).optional(),
});

export const validateTask = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.body = taskSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>),
      });
    }
    next(error);
  }
};
```

**Security Checklist:**

- [ ] All routes require authentication
- [ ] User can only access their own data
- [ ] Input validation on all endpoints
- [ ] SQL injection prevented (using Prisma)
- [ ] XSS prevented (React Native escapes by default)
- [ ] CSRF protection (using SameSite cookies)
- [ ] Rate limiting enabled
- [ ] Helmet middleware configured
- [ ] HTTPS enforced in production
- [ ] Environment variables never committed
- [ ] Secrets stored securely (Firebase Admin SDK)
- [ ] Regular dependency updates (npm audit)

---

## Performance & Optimization

### Frontend Performance

```typescript
// ✅ GOOD: Optimized list rendering
import React, { useMemo, useCallback } from 'react';
import { FlatList, View } from 'react-native';

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskPress }) => {
  // Memoize filtered/sorted data
  const sortedTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        // Sort by priority then due date
        const priorityOrder = { urgent_important: 0, important: 1, urgent: 2, low: 3, none: 4 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return 0;
      });
  }, [tasks]);
  
  // Memoize callbacks
  const handleTaskPress = useCallback((taskId: string) => {
    onTaskPress(taskId);
  }, [onTaskPress]);
  
  const renderItem = useCallback(({ item }) => (
    <TaskCard 
      task={item} 
      onPress={() => handleTaskPress(item.id)}
    />
  ), [handleTaskPress]);
  
  const keyExtractor = useCallback((item: Task) => item.id, []);
  
  return (
    <FlatList
      data={sortedTasks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // Performance optimizations
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      // Improve scroll performance
      getItemLayout={(data, index) => ({
        length: 80, // Estimated item height
        offset: 80 * index,
        index,
      })}
    />
  );
};

// Memoize expensive components
export const TaskCard = React.memo<TaskCardProps>(
  ({ task, onPress }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison
    return prevProps.task.id === nextProps.task.id &&
           prevProps.task.updatedAt === nextProps.task.updatedAt;
  }
);
```

### Backend Performance

```typescript
// ✅ GOOD: Optimized database queries
// Batch loading to avoid N+1 queries
const getTasksWithDetails = async (userId: string) => {
  // ✅ Single query with joins
  const tasks = await prisma.task.findMany({
    where: { userId },
    include: {
      subtasks: true,
      reminders: {
        where: { sent: false },
      },
      checklistItems: true,
    },
  });
  
  return tasks;
  
  // ❌ N+1 query problem
  // const tasks = await prisma.task.findMany({ where: { userId } });
  // for (const task of tasks) {
  //   task.subtasks = await prisma.task.findMany({ where: { parentTaskId: task.id } });
  // }
};

// Use database indexes
// In schema.prisma:
// @@index([userId, status])
// @@index([dueDate])

// Cache expensive operations
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

const getUserStats = async (userId: string) => {
  const cacheKey = `stats:${userId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Calculate stats
  const [taskCount, habitStreak, totalXP] = await Promise.all([
    prisma.task.count({ where: { userId, status: { not: 'done' } } }),
    getHabitStreak(userId),
    getTotalXP(userId),
  ]);
  
  const stats = { taskCount, habitStreak, totalXP };
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(stats));
  
  return stats;
};
```

**Performance Rules:**
- Use `useMemo` for expensive calculations
- Use `useCallback` for function props to memoized children
- Memoize list item components
- Optimize FlatList configuration
- Lazy load screens/components
- Compress images (use Expo image optimization)
- Minimize bundle size (check with `npx react-native-bundle-visualizer`)
- Use database indexes for frequent queries
- Batch database operations
- Cache expensive API responses

---

## Documentation

### Code Documentation

```typescript
// ✅ GOOD: Well-documented complex function
/**
 * Calculates XP reward for completing a task based on multiple factors.
 * 
 * XP Calculation:
 * - Base: 10 XP
 * - Priority multiplier:
 *   - urgent_important: 2.0x
 *   - important: 1.5x
 *   - urgent: 1.3x
 *   - low/none: 1.0x
 * - Subtask completion bonus: +5 XP (if all subtasks completed)
 * - Overdue penalty: -5 XP (if completed after due date)
 * 
 * @param task - The completed task
 * @returns XP amount (minimum 5, maximum 50)
 * 
 * @example
 * const xp = calculateTaskXP({
 *   priority: 'urgent_important',
 *   subtasks: [{ isCompleted: true }],
 *   dueDate: yesterday,
 * });
 * // Returns: 20 + 5 - 5 = 20 XP
 */
export const calculateTaskXP = (task: Task): number => {
  const BASE_XP = 10;
  
  const priorityMultipliers: Record<TaskPriority, number> = {
    urgent_important: 2.0,
    important: 1.5,
    urgent: 1.3,
    low: 1.0,
    none: 1.0,
  };
  
  let xp = BASE_XP * priorityMultipliers[task.priority];
  
  // Subtask completion bonus
  if (task.subtasks?.every(s => s.isCompleted)) {
    xp += 5;
  }
  
  // Overdue penalty
  if (task.dueDate && new Date() > task.dueDate) {
    xp -= 5;
  }
  
  // Clamp between 5 and 50
  return Math.max(5, Math.min(50, Math.round(xp)));
};
```

### API Documentation

```typescript
// ✅ GOOD: Documented API endpoint
/**
 * GET /api/tasks
 * 
 * Retrieves tasks for the authenticated user with optional filtering.
 * 
 * Query Parameters:
 * - status: string[] - Filter by status (inbox, todo, in_progress, etc.)
 * - priority: string[] - Filter by priority
 * - search: string - Search in title and description
 * - page: number - Page number (default: 1)
 * - pageSize: number - Items per page (default: 20, max: 100)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     items: Task[],
 *     pagination: {
 *       page: number,
 *       pageSize: number,
 *       total: number,
 *       hasMore: boolean
 *     }
 *   }
 * }
 * 
 * Errors:
 * - 401: Unauthorized (missing or invalid token)
 * - 500: Server error
 */
router.get('/tasks', authenticateUser, taskController.listTasks);
```

### README Updates

Keep documentation files up to date:
- `README.md` - Project overview and quick start
- `STYLE_GUIDE.md` - This file (coding standards)
- `warp.md` - Technical documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history

---

## Git Workflow

### Commit Messages

```bash
# ✅ GOOD: Clear, descriptive commits
feat: add task breakdown AI tool with Claude integration
fix: prevent streak loss when server is unreachable
refactor: extract habit streak calculation into utility
docs: update API documentation for gamification endpoints
test: add integration tests for focus session API
perf: optimize task list rendering with memoization
style: apply consistent button styling across app
chore: update dependencies to latest stable versions

# ❌ BAD: Vague commits
fix stuff
updates
wip
changed files
```

**Commit Message Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `chore`: Maintenance tasks (dependencies, build, etc.)

### Branch Strategy

```bash
# Main branches
main                    # Production-ready code
develop                 # Integration branch

# Feature branches
feature/task-breakdown  # New feature
feature/ai-coach
feature/habit-streaks

# Fix branches
fix/focus-timer-bug
fix/api-error-handling

# Refactor branches
refactor/component-structure
refactor/api-responses
```

---

## Final Ethical Commitments

As developers of BrainXP, we commit to:

1. **User Wellbeing Over Metrics**
   - Success is measured by user outcomes, not engagement time
   - Features that harm user wellbeing are removed, even if popular

2. **Transparency & Honesty**
   - Clear about what the app can and cannot do
   - Honest about AI capabilities and limitations
   - Transparent about data collection and usage

3. **Respect for Neurodiversity**
   - ADHD is a different cognitive style, not a disorder to "fix"
   - Features empower users, not "correct" them
   - Celebrate user achievements without judgment

4. **Evidence-Based Development**
   - Features grounded in ADHD research
   - Regular user testing with people who have ADHD
   - Willingness to remove features that don't help

5. **Privacy as Default**
   - Minimal data collection
   - No selling user data ever
   - Easy data export and deletion

6. **Accessibility for All**
   - WCAG compliance as minimum standard
   - Regular accessibility audits
   - Listen to feedback from disabled users

7. **Open to Feedback**
   - User feedback drives development
   - Quick to fix harmful patterns
   - Regular retrospectives on ethical impact

---

**Remember:** Code quality matters, but user wellbeing matters more. When in doubt, choose the option that respects and empowers the user.
