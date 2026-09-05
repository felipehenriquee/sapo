import { Component, Input, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { debounceTime, distinctUntilChanged, filter, firstValueFrom, of, switchMap } from 'rxjs'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'

import { InputComponent } from '@app/shared/components/input/input.component'
import { ButtonComponent } from '@app/shared/components/button/button.component'
import { DetailHeaderComponent } from '@app/shared/components/detail-header/detail-header.component'
import { StepperComponent } from '@app/shared/components/stepper/stepper.component'
import { RichEditorComponent } from '@app/shared/components/rich-editor/rich-editor.component'
import { QuestionFormComponent } from '@app/features/exercises/question-form/question-form.component'
import type { QuestionDraft } from '@app/features/exercises/question-form/question-form.component'
import { Icon } from '@app/shared/icon.enum'
import { color } from '@app/core/constants/colors'
import type { PaginatedResponse } from '@app/core/models/api.model'
import { LessonService } from '@app/features/lessons/services/lesson.service'
import type { Lesson, LessonType } from '@app/features/lessons/models/lesson.model'
import { ExerciseService } from '@app/features/exercises/services/exercise.service'
import type { ExerciseReferenceLessonRef } from '@app/features/exercises/models/exercise.model'
import { QuestionService } from '@app/features/exercises/services/question.service'
import type { Question } from '@app/features/exercises/models/question.model'

function isPaginated<T>(res: T[] | PaginatedResponse<T>): res is PaginatedResponse<T> {
  return !Array.isArray(res)
}

type ReferenceLessonValue = string | ExerciseReferenceLessonRef

/**
 * Página de criação de aula (rota `/courses/:id/units/:unitId/lessons/new`),
 * substitui o antigo modal de "adicionar aula" em `course-detail`. Wizard
 * de 2 passos via `app-stepper`: passo 0 é nome/descrição/tipo (cria a
 * Lesson); passo 1 depende do tipo — editor de conteúdo ou autoria de
 * perguntas do exercício.
 *
 * `type` fica travado (`disable()`) depois do primeiro avanço, pra evitar
 * o caso órfão de exercício/perguntas já criados e o tipo mudar depois —
 * voltar ao passo 0 só permite editar nome/descrição (via PATCH).
 */
@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    TranslocoPipe,
    InputComponent,
    ButtonComponent,
    DetailHeaderComponent,
    StepperComponent,
    RichEditorComponent,
    QuestionFormComponent,
  ],
  templateUrl: './lesson-form.component.html',
})
export class LessonFormComponent {
  private readonly fb = inject(FormBuilder)
  private readonly router = inject(Router)
  private readonly transloco = inject(TranslocoService)
  private readonly lessonService = inject(LessonService)
  private readonly exerciseService = inject(ExerciseService)
  private readonly questionService = inject(QuestionService)

  readonly Icon = Icon
  readonly color = color
  readonly lessonTypes: LessonType[] = ['content', 'exercise']

  /** Curso (pro backLink e pro escopo do autocomplete). */
  @Input() id?: string
  /** Unidade à qual a aula será anexada. */
  @Input() unitId?: string

  readonly step = signal(0)
  readonly saving = signal(false)
  readonly lessonId = signal<string | null>(null)
  readonly exerciseId = signal<string | null>(null)
  readonly questions = signal<Question[]>([])
  readonly addingQuestion = signal(false)
  readonly referenceLessonOptions = signal<ExerciseReferenceLessonRef[]>([])

  readonly detailsForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    type: ['content' as LessonType, [Validators.required]],
  })

  readonly contentCtrl = new FormControl('', { nonNullable: true })
  readonly referenceLessonCtrl = new FormControl<ReferenceLessonValue>('')

  constructor() {
    this.referenceLessonCtrl.valueChanges
      .pipe(
        filter((value): value is string => typeof value === 'string'),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          const search = term.trim()
          if (!search || !this.id) return of<Lesson[]>([])
          return this.lessonService.getAll({ search, type: 'content', courseId: this.id })
        }),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        const data = isPaginated(res) ? res.data : res
        this.referenceLessonOptions.set(
          data.map((lesson) => ({ id: String(lesson.id), name: lesson.name })),
        )
      })
  }

  get type(): LessonType {
    return this.detailsForm.controls.type.value
  }

  get backLink(): unknown[] {
    return this.id ? ['/courses', this.id] : ['/courses']
  }

  get stepLabels(): string[] {
    const secondKey =
      this.type === 'content' ? 'lessons.form.contentStep' : 'lessons.form.questionsStep'
    return [
      this.transloco.translate('lessons.form.detailsStep'),
      this.transloco.translate(secondKey),
    ]
  }

  displayLessonName = (lesson: ReferenceLessonValue | null): string =>
    lesson && typeof lesson === 'object' ? lesson.name : (lesson ?? '')

  cancel(): void {
    this.router.navigate(this.backLink)
  }

  back(): void {
    this.step.set(0)
  }

  async next(): Promise<void> {
    if (this.step() === 0) {
      await this.submitDetails()
    } else {
      await this.finish()
    }
  }

  async onReferenceLessonSelected(event: MatAutocompleteSelectedEvent): Promise<void> {
    const lesson = event.option.value as ExerciseReferenceLessonRef
    const exerciseId = this.exerciseId()
    if (!exerciseId) return
    await firstValueFrom(this.exerciseService.update(exerciseId, { referenceLessonId: lesson.id }))
  }

  async addQuestion(draft: QuestionDraft): Promise<void> {
    const exerciseId = this.exerciseId()
    if (!exerciseId) return
    const name = `${this.transloco.translate('lessons.form.questionContent')} ${this.questions().length + 1}`
    const created = await firstValueFrom(
      this.questionService.create({ ...draft, name, exerciseId }),
    )
    this.questions.update((list) => [...list, created])
    this.addingQuestion.set(false)
  }

  async removeQuestion(question: Question): Promise<void> {
    await firstValueFrom(this.questionService.delete(question.id))
    this.questions.update((list) => list.filter((q) => q.id !== question.id))
  }

  private async submitDetails(): Promise<void> {
    if (this.detailsForm.invalid || !this.unitId) {
      this.detailsForm.markAllAsTouched()
      return
    }

    const { name, description, type } = this.detailsForm.getRawValue()
    const payload = { name, description: description.trim() || undefined }

    this.saving.set(true)
    try {
      const existingId = this.lessonId()
      if (!existingId) {
        const lesson = await firstValueFrom(
          this.lessonService.create({ ...payload, type, unitId: this.unitId }),
        )
        this.lessonId.set(String(lesson.id))
        this.detailsForm.controls.type.disable()

        if (type === 'exercise') {
          const exercise = await firstValueFrom(
            this.exerciseService.create({
              name,
              description: payload.description,
              lessonId: String(lesson.id),
            }),
          )
          this.exerciseId.set(String(exercise.id))
        }
      } else {
        await firstValueFrom(this.lessonService.update(existingId, payload))
      }
      this.step.set(1)
    } finally {
      this.saving.set(false)
    }
  }

  private async finish(): Promise<void> {
    const lessonId = this.lessonId()
    if (this.type === 'content' && lessonId) {
      this.saving.set(true)
      try {
        await firstValueFrom(
          this.lessonService.update(lessonId, { content: this.contentCtrl.value }),
        )
      } finally {
        this.saving.set(false)
      }
    }
    this.router.navigate(this.backLink)
  }
}
