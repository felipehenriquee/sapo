import { Injectable } from '@angular/core'

import { BaseService } from '@app/core/services/base.service'
import type {
  CreateExercisePayload,
  Exercise,
  UpdateExercisePayload,
} from '@app/features/exercises/models/exercise.model'

/** Service da feature "exercises". CRUD via BaseService no endpoint `/exercises`. */
@Injectable({ providedIn: 'root' })
export class ExerciseService extends BaseService<
  Exercise,
  CreateExercisePayload,
  UpdateExercisePayload
> {
  protected override resource = '/exercises'
}
