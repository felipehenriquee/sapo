import type { BaseEntity } from '@app/core/models/api.model'

export type QuestionType = 'objective' | 'subjective'

/** Alternativa de uma pergunta objetiva. O texto é o próprio `name` (BaseEntity). */
export type QuestionItem = BaseEntity

/** Pergunta de um exercício. name/description herdados de BaseEntity. */
export interface Question extends BaseEntity {
  exerciseId: string
  content: string
  type: QuestionType
  /** Alternativas — só presente na resposta de getById. */
  items?: QuestionItem[]
}

/**
 * Payload de criação. `items`/`correctItemIndex`/`correctText` não são
 * campos da entidade — só existem no payload: o backend cria as
 * QuestionItem à parte e grava o AnswerKey (nunca devolvido de volta por
 * nenhuma rota de Question). `correctItemIndex` é usado quando objetiva,
 * `correctText` quando dissertativa.
 */
export interface CreateQuestionPayload {
  name: string
  description?: string
  content: string
  type?: QuestionType
  items?: string[]
  correctItemIndex?: number
  correctText?: string
  exerciseId: string
}

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>
