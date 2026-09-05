import { Component, EventEmitter, Output, inject } from '@angular/core'
import { FormControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { MatRadioModule } from '@angular/material/radio'
import { TranslocoPipe } from '@jsverse/transloco'

import { InputComponent } from '@app/shared/components/input/input.component'
import { ButtonComponent } from '@app/shared/components/button/button.component'
import { Icon } from '@app/shared/icon.enum'
import { color } from '@app/core/constants/colors'
import type { QuestionType } from '@app/features/exercises/models/question.model'

/**
 * Rascunho de uma pergunta — sem `name`/`exerciseId`: quem usa este
 * component (a página do wizard) monta o payload completo, já que esses
 * dois campos não fazem parte do que o usuário preenche aqui.
 */
export interface QuestionDraft {
  content: string
  type: QuestionType
  items?: string[]
  correctItemIndex?: number
  correctText?: string
}

/**
 * Mini-formulário de criação de uma pergunta — sem HTTP próprio, só emite
 * `submitted` com o rascunho pronto; quem persiste (POST /questions) é a
 * página que o usa. Objetiva ganha uma lista dinâmica de alternativas com
 * seleção de qual é a correta (vira o AnswerKey no backend).
 */
@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatRadioModule,
    InputComponent,
    ButtonComponent,
    TranslocoPipe,
  ],
  templateUrl: './question-form.component.html',
})
export class QuestionFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable

  readonly Icon = Icon
  readonly color = color
  readonly questionTypes: QuestionType[] = ['objective', 'subjective']

  @Output() submitted = new EventEmitter<QuestionDraft>()
  @Output() cancelled = new EventEmitter<void>()

  readonly form = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(100)]],
    type: ['objective' as QuestionType, [Validators.required]],
  })

  readonly items = this.fb.array<FormControl<string>>([
    this.fb.control('', [Validators.required]),
    this.fb.control('', [Validators.required]),
  ])

  readonly correctIndex = new FormControl<number | null>(null)
  readonly correctTextCtrl = this.fb.control('', [Validators.required])
  touched = false

  get isObjective(): boolean {
    return this.form.controls.type.value === 'objective'
  }

  addItem(): void {
    this.items.push(this.fb.control('', [Validators.required]))
  }

  removeItem(index: number): void {
    if (this.items.length <= 2) return
    this.items.removeAt(index)
    if (this.correctIndex.value === index) {
      this.correctIndex.setValue(null)
    } else if (this.correctIndex.value !== null && this.correctIndex.value > index) {
      this.correctIndex.setValue(this.correctIndex.value - 1)
    }
  }

  submit(): void {
    this.touched = true
    const { content, type } = this.form.getRawValue()

    if (this.form.invalid) return

    if (type === 'objective') {
      if (this.items.invalid || this.correctIndex.value === null) return
      this.submitted.emit({
        content,
        type,
        items: this.items.getRawValue(),
        correctItemIndex: this.correctIndex.value,
      })
    } else {
      if (this.correctTextCtrl.invalid) return
      this.submitted.emit({ content, type, correctText: this.correctTextCtrl.value })
    }

    this.reset()
  }

  cancel(): void {
    this.reset()
    this.cancelled.emit()
  }

  private reset(): void {
    this.touched = false
    this.form.reset({ content: '', type: 'objective' })
    this.items.clear()
    this.addItem()
    this.addItem()
    this.correctIndex.setValue(null)
    this.correctTextCtrl.setValue('')
  }
}
