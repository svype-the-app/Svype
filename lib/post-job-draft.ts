type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote'

export type PostJobDraftFormData = {
  title: string
  location: string
  type: EmploymentType
  salaryMin: string
  salaryMax: string
  description: string
}

type PostJobDraftState = {
  formData: PostJobDraftFormData
  requirements: string[]
  enablePreScreening: boolean
  enableAIInterview: boolean
  showSectionHint: boolean
}

const initialDraftState: PostJobDraftState = {
  formData: {
    title: '',
    location: '',
    type: 'Full-time',
    salaryMin: '',
    salaryMax: '',
    description: '',
  },
  requirements: [''],
  enablePreScreening: false,
  enableAIInterview: false,
  showSectionHint: true,
}

let draftState: PostJobDraftState = { ...initialDraftState, formData: { ...initialDraftState.formData } }

export function getPostJobDraft(): PostJobDraftState {
  return draftState
}

export function setPostJobDraft(state: PostJobDraftState) {
  draftState = {
    ...state,
    formData: { ...state.formData },
    requirements: state.requirements.length > 0 ? [...state.requirements] : [''],
  }
}

export function resetPostJobDraft() {
  draftState = {
    ...initialDraftState,
    formData: { ...initialDraftState.formData },
    requirements: [...initialDraftState.requirements],
  }
}
