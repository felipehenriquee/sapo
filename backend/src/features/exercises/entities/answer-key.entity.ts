import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { Question } from '@/features/exercises/entities/question.entity'
import { QuestionItem } from '@/features/exercises/entities/question-item.entity'

/**
 * Resposta certa de uma Question. Tabela isolada DE PROPÓSITO: nenhum
 * endpoint/consulta de Question faz join com AnswerKey — só assim um aluno
 * não consegue a resposta antes da hora inspecionando a API. Por isso não
 * estende BaseEntity (name/description não fariam sentido aqui).
 */
@Entity('answer_keys')
export class AnswerKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @OneToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question

  @Column({ name: 'question_id', type: 'varchar', length: 36, unique: true })
  questionId!: string

  /** Só setado quando a pergunta é objetiva. */
  @ManyToOne(() => QuestionItem, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'correct_item_id' })
  correctItem?: QuestionItem

  @Column({ name: 'correct_item_id', type: 'varchar', length: 36, nullable: true })
  correctItemId!: string | null

  /** Resposta esperada de uma pergunta dissertativa (`type === 'subjective'`). */
  @Column({ name: 'correct_text', type: 'text', nullable: true })
  correctText!: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
