import { Injectable } from '@angular/core'

import { BaseService } from '@app/core/services/base.service'
import type {
  CreateQuestionPayload,
  Question,
  UpdateQuestionPayload,
} from '@app/features/exercises/models/question.model'

/** Service da feature "questions". CRUD via BaseService no endpoint `/questions`. */
@Injectable({ providedIn: 'root' })
export class QuestionService extends BaseService<
  Question,
  CreateQuestionPayload,
  UpdateQuestionPayload
> {
  protected override resource = '/questions'
}
