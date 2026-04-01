export type QuizQuestionDraft = {
  id: string
  type: 'multiple-choice' | 'text'
  question: string
  options: string[]
  correctAnswer: number
  points: number
}

type QuizDraftState = {
  questions: QuizQuestionDraft[]
  confirmed: boolean
}

let draftState: QuizDraftState = {
  questions: [],
  confirmed: false,
}

export function getPostJobQuizDraft(): QuizDraftState {
  return draftState
}

export function setPostJobQuizDraft(state: QuizDraftState) {
  draftState = state
}

export function resetPostJobQuizDraft() {
  draftState = {
    questions: [],
    confirmed: false,
  }
}
