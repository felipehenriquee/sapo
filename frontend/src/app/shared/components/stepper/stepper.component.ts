import { Component, EventEmitter, Input, Output, booleanAttribute } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'

import { ButtonComponent } from '@app/shared/components/button/button.component'
import { color } from '@app/core/constants/colors'

/**
 * Casca genérica de wizard multi-step — mesma ideia do `app-general-modal`
 * (componente "chrome" + `<ng-content>` pro corpo), só que pra formulários
 * em várias etapas dentro de uma página normal (não um modal). O corpo de
 * cada etapa é decidido pelo componente pai (ex: `@switch (activeIndex())`),
 * este component só desenha o indicador de progresso e os botões
 * Voltar/Próximo.
 */
@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [ButtonComponent, TranslocoPipe],
  templateUrl: './stepper.component.html',
})
export class StepperComponent {
  readonly color = color

  /** Rótulo de cada etapa, na ordem. */
  @Input() steps: string[] = []
  @Input() activeIndex = 0
  @Input({ transform: booleanAttribute }) canGoBack = true
  @Input({ transform: booleanAttribute }) nextDisabled = false
  @Input({ transform: booleanAttribute }) saving = false

  @Output() back = new EventEmitter<void>()
  @Output() next = new EventEmitter<void>()
  /** Emite quando "Cancelar" é clicado — só aparece na 1ª etapa (no lugar do "Voltar"). */
  @Output() cancelled = new EventEmitter<void>()

  get isLastStep(): boolean {
    return this.activeIndex >= this.steps.length - 1
  }
}
