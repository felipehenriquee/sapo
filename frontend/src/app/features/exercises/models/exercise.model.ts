import type { BaseEntity } from '@app/core/models/api.model'

/** Referência enxuta de uma pergunta (sem alternativas), como vem no getById do exercício. */
export interface ExerciseQuestionRef {
  id: string
  content: string
  type: 'objective' | 'subjective'
}

/** Referência enxuta de uma aula (só id + nome). */
export interface ExerciseReferenceLessonRef {
  id: string
  name: string
}

/** Exercício de uma aula do tipo "exercise". name/description herdados de BaseEntity. */
export interface Exercise extends BaseEntity {
  lessonId: string
  /** Aula de conteúdo à qual este exercício se refere. Opcional. */
  referenceLessonId?: string | null
  /** Só presente na resposta de getById. */
  referenceLesson?: ExerciseReferenceLessonRef
  content?: string | null
  score: number
  /** Perguntas do exercício. Só presente na resposta de getById. */
  questions?: ExerciseQuestionRef[]
}

/** Payload de criação: sem id nem campos derivados/refs. */
export type CreateExercisePayload = Omit<
  Exercise,
  'id' | 'questions' | 'referenceLesson' | 'score'
> & { score?: number }

/** Payload de atualização: tudo opcional (PATCH parcial). */
export type UpdateExercisePayload = Partial<CreateExercisePayload>
