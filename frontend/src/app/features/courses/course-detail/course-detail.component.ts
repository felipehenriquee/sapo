import { Component, Input, OnInit, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { firstValueFrom } from 'rxjs'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { MatExpansionModule } from '@angular/material/expansion'

import { ButtonComponent } from '@app/shared/components/button/button.component'
import { InputComponent } from '@app/shared/components/input/input.component'
import { DetailField } from '@app/shared/components/details-modal/details-modal.component'
import { GeneralModalComponent } from '@app/shared/components/general-modal/general-modal.component'
import { DetailHeaderComponent } from '@app/shared/components/detail-header/detail-header.component'
import { Icon } from '@app/shared/icon.enum'
import { color } from '@app/core/constants/colors'
import { CoursesStore } from '@app/features/courses/state/courses.store'
import { UnitService } from '@app/features/units/services/unit.service'
import type { Course, CourseUnitRef } from '@app/features/courses/models/course.model'
import type { Unit, UnitLessonRef } from '@app/features/units/models/unit.model'

/**
 * Tela de detalhe do curso (rota `/courses/:id`). Mostra os dados do curso e
 * as unidades como accordions: o header traz o nome e o nº de aulas; ao
 * abrir, busca a unidade por id e lista as aulas (clicar numa aula abre a
 * página da aula, `/courses/:id/lessons/:lessonId`).
 *
 * "Adicionar aula" navega pra uma página própria (`lesson-form`, com steps);
 * só "adicionar módulo" ainda usa o GeneralModal genérico.
 */
@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    TranslocoPipe,
    ButtonComponent,
    InputComponent,
    GeneralModalComponent,
    DetailHeaderComponent,
  ],
  templateUrl: './course-detail.component.html',
})
export class CourseDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder)
  private readonly router = inject(Router)
  private readonly coursesStore = inject(CoursesStore)
  private readonly unitService = inject(UnitService)
  private readonly transloco = inject(TranslocoService)

  readonly Icon = Icon
  readonly color = color

  /** Vem da rota `/courses/:id` (withComponentInputBinding). */
  @Input() id?: string

  readonly course = signal<Course | null>(null)
  readonly loading = signal(true)
  readonly error = signal<string | null>(null)

  /** Unidade completa (descrição + aulas) por id — cache dos accordions abertos. */
  readonly unitDetails = signal<Record<string, Unit>>({})
  readonly loadingUnit = signal<string | null>(null)

  // --- formulário de criação de módulo ---
  readonly unitFormOpen = signal(false)
  readonly saving = signal(false)
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
  })

  async ngOnInit(): Promise<void> {
    if (!this.id) return
    try {
      this.course.set(await this.coursesStore.getById(this.id))
    } catch (err) {
      this.error.set((err as Error).message)
    } finally {
      this.loading.set(false)
    }
  }

  get units(): CourseUnitRef[] {
    return this.course()?.units ?? []
  }

  get detailFields(): DetailField[] {
    const course = this.course()
    if (!course) return []
    return [
      { label: this.transloco.translate('courses.details.name'), value: course.name },
      { label: this.transloco.translate('courses.details.description'), value: course.description },
      { label: this.transloco.translate('courses.details.units'), value: course.unitsCount },
    ]
  }

  lessonsOf(unitId: string): UnitLessonRef[] | undefined {
    return this.unitDetails()[unitId]?.lessons
  }

  unitDescription(unitId: string): string | undefined {
    return this.unitDetails()[unitId]?.description
  }

  format(value: unknown): string {
    return value === null || value === undefined || value === '' ? '—' : String(value)
  }

  async onPanelOpened(unitId: string): Promise<void> {
    if (this.unitDetails()[unitId]) return
    await this.loadUnit(unitId)
  }

  /** Abre a página da aula (conteúdo completo + edição WYSIWYG). */
  openLesson(ref: UnitLessonRef): void {
    void this.router.navigate(['/courses', this.id, 'lessons', ref.id])
  }

  /** Abre a página de criação de aula (wizard de steps). */
  openAddLesson(unitId: string): void {
    void this.router.navigate(['/courses', this.id, 'units', unitId, 'lessons', 'new'])
  }

  openAddUnit(): void {
    this.form.reset()
    this.unitFormOpen.set(true)
  }

  closeForm(): void {
    this.unitFormOpen.set(false)
  }

  async saveForm(): Promise<void> {
    if (this.form.invalid || !this.id) {
      this.form.markAllAsTouched()
      return
    }

    const { name, description } = this.form.getRawValue()
    const payload = { name, description: description.trim() || undefined }
    this.saving.set(true)
    try {
      await firstValueFrom(this.unitService.create({ ...payload, courseId: this.id }))
      this.course.set(await this.coursesStore.getById(this.id))
      this.unitFormOpen.set(false)
    } finally {
      this.saving.set(false)
    }
  }

  private async loadUnit(unitId: string): Promise<void> {
    this.loadingUnit.set(unitId)
    try {
      const unit = await firstValueFrom(this.unitService.getById(unitId))
      this.unitDetails.update((map) => ({ ...map, [unitId]: unit }))
    } finally {
      this.loadingUnit.set(null)
    }
  }
}
