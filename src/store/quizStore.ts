import { create } from 'zustand';

export type QuestionData = {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  order: number;
};

export type QuizData = {
  id?: string;
  title: string;
  description: string;
  questions: QuestionData[];
  has_timer: boolean;
  question_timer_seconds: number;
};

interface QuizStore {
  quizData: QuizData;
  setQuizData: (data: QuizData) => void;
  updateQuizField: (field: keyof Omit<QuizData, 'questions'>, value: any) => void;
  updateQuestion: (index: number, field: keyof QuestionData, value: any) => void;
  updateOption: (questionIndex: number, optionIndex: number, value: string) => void;
  addQuestion: () => void;
  removeQuestion: (index: number) => void;
  moveQuestion: (index: number, direction: 'up' | 'down') => void;
  addGeneratedQuestions: (questions: QuestionData[]) => void;
  resetQuizData: () => void;
}

const initialQuizData: QuizData = {
  title: '',
  description: '',
  questions: [],
  has_timer: false,
  question_timer_seconds: 20
};

export const useQuizStore = create<QuizStore>((set, get) => ({
  quizData: initialQuizData,

  setQuizData: (data: QuizData) => set({ quizData: data }),

  updateQuizField: (field: keyof Omit<QuizData, 'questions'>, value: any) =>
    set((state) => ({
      quizData: {
        ...state.quizData,
        [field]: value
      }
    })),

  updateQuestion: (index: number, field: keyof QuestionData, value: any) =>
    set((state) => {
      const updatedQuestions = [...state.quizData.questions];
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value
      };
      return {
        quizData: {
          ...state.quizData,
          questions: updatedQuestions
        }
      };
    }),

  updateOption: (questionIndex: number, optionIndex: number, value: string) =>
    set((state) => {
      const updatedQuestions = [...state.quizData.questions];
      const options = [...updatedQuestions[questionIndex].options];
      options[optionIndex] = value;
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        options
      };
      return {
        quizData: {
          ...state.quizData,
          questions: updatedQuestions
        }
      };
    }),

  addQuestion: () =>
    set((state) => {
      const newOrder = state.quizData.questions.length;
      return {
        quizData: {
          ...state.quizData,
          questions: [
            ...state.quizData.questions,
            {
              question_text: '',
              options: ['', '', '', ''],
              correct_answer: '',
              explanation: '',
              order: newOrder
            }
          ]
        }
      };
    }),

  removeQuestion: (index: number) =>
    set((state) => {
      const updatedQuestions = state.quizData.questions.filter((_, i) => i !== index);
      return {
        quizData: {
          ...state.quizData,
          questions: updatedQuestions.map((q, i) => ({ ...q, order: i }))
        }
      };
    }),

  moveQuestion: (index: number, direction: 'up' | 'down') =>
    set((state) => {
      const questions = [...state.quizData.questions];
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === questions.length - 1)
      ) {
        return state; // No change needed
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [questions[index], questions[targetIndex]] = [questions[targetIndex], questions[index]];

      return {
        quizData: {
          ...state.quizData,
          questions: questions.map((q, i) => ({ ...q, order: i }))
        }
      };
    }),

  addGeneratedQuestions: (questions: QuestionData[]) =>
    set((state) => {
      const currentLength = state.quizData.questions.length;
      const questionsWithOrder = questions.map((q, index) => ({
        ...q,
        order: currentLength + index
      }));
      
      return {
        quizData: {
          ...state.quizData,
          questions: [...state.quizData.questions, ...questionsWithOrder]
        }
      };
    }),

  resetQuizData: () => set({ quizData: initialQuizData })
}));