import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StudySet,
  Flashcard,
  StudySession,
  Quiz,
  QuizAttempt,
  FlashcardReview,
  calculateSM2,
  StudyMode,
} from '../types/study';

interface StudyStats {
  totalCards: number;
  masteredCards: number;
  dueToday: number;
  totalSets: number;
  averageAccuracy: number;
}

interface StudyState {
  studySets: StudySet[];
  currentSession: StudySession | null;
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  flashcards: Record<string, Flashcard[]>;
  stats: StudyStats | null;
  activeSession: StudySession | null;
  sessionCards: Flashcard[];
  currentCardIndex: number;
  isLoading: boolean;
  
  // Study Set Actions
  createStudySet: (input: { title: string; description?: string; icon?: string; color?: string }) => StudySet;
  updateStudySet: (id: string, updates: Partial<StudySet>) => void;
  deleteStudySet: (id: string) => void;
  fetchStudySets: () => Promise<void>;
  fetchStats: () => Promise<void>;
  
  // Flashcard Actions
  addFlashcard: (studySetId: string, front: string, back: string, extras?: Partial<Flashcard>) => Flashcard;
  createFlashcard: (input: { studySetId: string; front: string; back: string; hint?: string; explanation?: string; tags?: string[] }) => Flashcard;
  updateFlashcard: (studySetId: string, cardId: string, updates: Partial<Flashcard>) => void;
  deleteFlashcard: (studySetId: string, cardId: string) => void;
  reviewFlashcard: (studySetId: string, cardId: string, quality: number) => void;
  reviewCard: (quality: number) => void;
  skipCard: () => void;
  
  // Study Session Actions
  startStudySession: (studySetId: string, mode: StudyMode) => StudySession;
  recordCardResult: (cardId: string, quality: number, responseTime?: number) => void;
  endStudySession: () => void;
  getSessionProgress: () => { current: number; total: number; correct: number; incorrect: number };
  
  // Quiz Actions
  createQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>) => Quiz;
  submitQuizAttempt: (quizId: string, answers: QuizAttempt['answers']) => QuizAttempt;
  
  // Selectors
  getStudySetById: (id: string) => StudySet | undefined;
  getCardsForReview: (studySetId: string, limit?: number) => Flashcard[];
  getDueCardsCount: (studySetId: string) => number;
  getStudyStats: () => { totalCards: number; masteredCards: number; dueToday: number };
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      studySets: [],
      currentSession: null,
      quizzes: [],
      quizAttempts: [],
      flashcards: {},
      stats: null,
      activeSession: null,
      sessionCards: [],
      currentCardIndex: 0,
      isLoading: false,
      
      // ═══════════════════════════════════════════════════════════════════════════
      // Fetch Actions
      // ═══════════════════════════════════════════════════════════════════════════
      
      fetchStudySets: async () => {
        set({ isLoading: true });
        // For now, just mark as loaded - data is persisted locally
        // Also sync flashcards from studySets
        const { studySets } = get();
        const flashcardsMap: Record<string, Flashcard[]> = {};
        studySets.forEach((studySet) => {
          flashcardsMap[studySet.id] = studySet.cards || [];
        });
        set({ isLoading: false, flashcards: flashcardsMap });
      },
      
      fetchStats: async () => {
        const stats = get().getStudyStats();
        set({
          stats: {
            ...stats,
            totalSets: get().studySets.length,
            averageAccuracy: 0, // Calculate from quiz attempts
          },
        });
      },
      
      // ═══════════════════════════════════════════════════════════════════════════
      // Study Set Actions
      // ═══════════════════════════════════════════════════════════════════════════
      
      createStudySet: (input) => {
        const now = new Date().toISOString();
        const studySet: StudySet = {
          id: generateId(),
          userId: '1',
          title: input.title,
          description: input.description,
          icon: input.icon,
          color: input.color,
          isPublic: false,
          isFavorite: false,
          aiGenerated: false,
          createdAt: now,
          updatedAt: now,
          cards: [],
        };

        set((state) => ({
          studySets: [...state.studySets, studySet],
          flashcards: { ...state.flashcards, [studySet.id]: [] },
        }));

        return studySet;
      },

      updateStudySet: (id, updates) => {
        set((state) => ({
          studySets: state.studySets.map((s) =>
            s.id === id
              ? { ...s, ...updates, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },
      
      deleteStudySet: (id) => {
        set((state) => {
          const { [id]: _, ...restFlashcards } = state.flashcards;
          return {
            studySets: state.studySets.filter((s) => s.id !== id),
            flashcards: restFlashcards,
          };
        });
      },
      
      // ═══════════════════════════════════════════════════════════════════════════
      // Flashcard Actions
      // ═══════════════════════════════════════════════════════════════════════════
      
      addFlashcard: (studySetId, front, back, extras) => {
        const studySet = get().studySets.find((s) => s.id === studySetId);
        if (!studySet) throw new Error('Study set not found');
        
        const now = new Date().toISOString();
        const card: Flashcard = {
          id: generateId(),
          studySetId,
          front,
          back,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          learningState: 'new',
          lapses: 0,
          tags: [],
          order: studySet.cards.length,
          aiGenerated: false,
          createdAt: now,
          updatedAt: now,
          ...extras,
        };
        
        set((state) => ({
          studySets: state.studySets.map((s) =>
            s.id === studySetId
              ? { ...s, cards: [...s.cards, card], updatedAt: now }
              : s
          ),
          flashcards: {
            ...state.flashcards,
            [studySetId]: [...(state.flashcards[studySetId] || []), card],
          },
        }));

        return card;
      },

      updateFlashcard: (studySetId, cardId, updates) => {
        set((state) => {
          const updatedAt = new Date().toISOString();
          const updateCard = (c: Flashcard) =>
            c.id === cardId ? { ...c, ...updates, updatedAt } : c;
          return {
            studySets: state.studySets.map((s) =>
              s.id === studySetId
                ? { ...s, cards: s.cards.map(updateCard), updatedAt }
                : s
            ),
            flashcards: {
              ...state.flashcards,
              [studySetId]: (state.flashcards[studySetId] || []).map(updateCard),
            },
          };
        });
      },
      
      deleteFlashcard: (studySetId, cardId) => {
        set((state) => {
          const updatedAt = new Date().toISOString();
          return {
            studySets: state.studySets.map((s) =>
              s.id === studySetId
                ? { ...s, cards: s.cards.filter((c) => c.id !== cardId), updatedAt }
                : s
            ),
            flashcards: {
              ...state.flashcards,
              [studySetId]: (state.flashcards[studySetId] || []).filter((c) => c.id !== cardId),
            },
          };
        });
      },
      
      reviewFlashcard: (studySetId, cardId, quality) => {
        const studySet = get().studySets.find((s) => s.id === studySetId);
        const card = studySet?.cards.find((c) => c.id === cardId);
        
        if (!card) return;
        
        const result = calculateSM2(
          quality,
          card.easeFactor,
          card.interval,
          card.repetitions
        );
        
        const updates: Partial<Flashcard> = {
          easeFactor: result.newEaseFactor,
          interval: result.newInterval,
          repetitions: result.newRepetitions,
          nextReview: result.nextReview.toISOString(),
          lastReview: new Date().toISOString(),
          learningState: quality >= 3 ? 'review' : 'relearning',
          lapses: quality < 3 ? card.lapses + 1 : card.lapses,
        };
        
        get().updateFlashcard(studySetId, cardId, updates);
      },
      
      createFlashcard: (input) => {
        return get().addFlashcard(input.studySetId, input.front, input.back, {
          hint: input.hint,
          explanation: input.explanation,
          tags: input.tags,
        });
      },
      
      reviewCard: (quality) => {
        const { activeSession, sessionCards, currentCardIndex } = get();
        if (!activeSession) return;
        
        const card = sessionCards[currentCardIndex];
        if (!card) return;
        
        get().reviewFlashcard(activeSession.studySetId, card.id, quality);
        get().recordCardResult(card.id, quality);
        
        // Move to next card
        set({ currentCardIndex: currentCardIndex + 1 });
      },
      
      skipCard: () => {
        const { currentSession, sessionCards, currentCardIndex } = get();
        if (!currentSession) return;
        
        const card = sessionCards[currentCardIndex];
        
        set({
          currentSession: {
            ...currentSession,
            cardsSkipped: currentSession.cardsSkipped + 1,
          },
          currentCardIndex: currentCardIndex + 1,
        });
      },
      
      // ═══════════════════════════════════════════════════════════════════════════
      // Study Session Actions
      // ═══════════════════════════════════════════════════════════════════════════
      
      startStudySession: (studySetId, mode) => {
        const studySet = get().studySets.find((s) => s.id === studySetId);
        if (!studySet) throw new Error('Study set not found');
        
        const cardsToReview = get().getCardsForReview(studySetId);
        
        const session: StudySession = {
          id: generateId(),
          studySetId,
          userId: '1',
          mode,
          cardsTotal: cardsToReview.length,
          cardsReviewed: 0,
          cardsCorrect: 0,
          cardsIncorrect: 0,
          cardsSkipped: 0,
          cardResults: [],
          xpEarned: 0,
          startedAt: new Date().toISOString(),
        };
        
        set({
          currentSession: session,
          activeSession: session,
          sessionCards: cardsToReview,
          currentCardIndex: 0,
        });
        return session;
      },
      
      getSessionProgress: () => {
        const { currentSession, sessionCards, currentCardIndex } = get();
        return {
          current: currentCardIndex + 1,
          total: sessionCards.length || currentSession?.cardsTotal || 0,
          correct: currentSession?.cardsCorrect || 0,
          incorrect: currentSession?.cardsIncorrect || 0,
        };
      },
      
      recordCardResult: (cardId, quality, responseTime) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        const isCorrect = quality >= 3;
        
        set({
          currentSession: {
            ...currentSession,
            cardsReviewed: currentSession.cardsReviewed + 1,
            cardsCorrect: currentSession.cardsCorrect + (isCorrect ? 1 : 0),
            cardsIncorrect: currentSession.cardsIncorrect + (isCorrect ? 0 : 1),
            cardResults: [
              ...(currentSession.cardResults || []),
              { cardId, quality, responseTime },
            ],
          },
        });
        
        // Update the card with SM-2
        get().reviewFlashcard(currentSession.studySetId, cardId, quality);
      },
      
      endStudySession: () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        const duration = Math.floor(
          (Date.now() - new Date(currentSession.startedAt).getTime()) / 1000
        );
        
        // Calculate XP
        const xpEarned = currentSession.cardsCorrect * 5 + currentSession.cardsReviewed * 2;
        
        set({
          currentSession: {
            ...currentSession,
            endedAt: new Date().toISOString(),
            duration,
            xpEarned,
          },
        });
        
        // Clear session after a delay
        setTimeout(() => set({ currentSession: null }), 100);
      },
      
      // ═══════════════════════════════════════════════════════════════════════════
      // Quiz Actions
      // ═══════════════════════════════════════════════════════════════════════════
      
      createQuiz: (quiz) => {
        const now = new Date().toISOString();
        const newQuiz: Quiz = {
          ...quiz,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          quizzes: [...state.quizzes, newQuiz],
        }));
        
        return newQuiz;
      },
      
      submitQuizAttempt: (quizId, answers) => {
        const quiz = get().quizzes.find((q) => q.id === quizId);
        if (!quiz) throw new Error('Quiz not found');
        
        // Calculate score
        let pointsEarned = 0;
        const gradedAnswers = answers.map((answer) => {
          const question = quiz.questions.find((q) => q.id === answer.questionId);
          if (!question) return { ...answer, correct: false };
          
          const correct = Array.isArray(question.correctAnswer)
            ? JSON.stringify(question.correctAnswer.sort()) === JSON.stringify((answer.answer as string[]).sort())
            : question.correctAnswer === answer.answer;
          
          if (correct) pointsEarned += question.points;
          
          return { ...answer, correct };
        });
        
        const attempt: QuizAttempt = {
          id: generateId(),
          quizId,
          userId: '1',
          score: (pointsEarned / quiz.totalPoints) * 100,
          pointsEarned,
          pointsTotal: quiz.totalPoints,
          answers: gradedAnswers,
          xpEarned: Math.round(pointsEarned * 2),
          completedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          quizAttempts: [...state.quizAttempts, attempt],
        }));
        
        return attempt;
      },
      
      // ═══════════════════════════════════════════════════════════════════════════
      // Selectors
      // ═══════════════════════════════════════════════════════════════════════════
      
      getStudySetById: (id) => get().studySets.find((s) => s.id === id),
      
      getCardsForReview: (studySetId, limit = 20) => {
        const studySet = get().studySets.find((s) => s.id === studySetId);
        if (!studySet) return [];
        
        const now = new Date();
        
        // Get cards that are due or new
        return studySet.cards
          .filter((card) => {
            if (card.learningState === 'new') return true;
            if (!card.nextReview) return true;
            return new Date(card.nextReview) <= now;
          })
          .sort((a, b) => {
            // New cards first, then by due date
            if (a.learningState === 'new' && b.learningState !== 'new') return -1;
            if (b.learningState === 'new' && a.learningState !== 'new') return 1;
            if (!a.nextReview) return -1;
            if (!b.nextReview) return 1;
            return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime();
          })
          .slice(0, limit);
      },
      
      getDueCardsCount: (studySetId) => {
        return get().getCardsForReview(studySetId, 1000).length;
      },
      
      getStudyStats: () => {
        const { studySets } = get();
        const allCards = studySets.flatMap((s) => s.cards);
        const now = new Date();
        
        return {
          totalCards: allCards.length,
          masteredCards: allCards.filter((c) => c.interval >= 21).length,
          dueToday: allCards.filter((c) => {
            if (c.learningState === 'new') return true;
            if (!c.nextReview) return true;
            return new Date(c.nextReview) <= now;
          }).length,
        };
      },
    }),
    {
      name: 'study-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        studySets: state.studySets,
        quizzes: state.quizzes,
        quizAttempts: state.quizAttempts,
      }),
    }
  )
);

export default useStudyStore;
