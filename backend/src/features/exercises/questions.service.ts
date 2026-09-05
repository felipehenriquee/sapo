import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, Like, Repository } from 'typeorm'

import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto'
import { NotFoundError } from '@/common/errors'
import { BaseService } from '@/common/services/base.service'
import { Question } from '@/features/exercises/entities/question.entity'
import { QuestionItem } from '@/features/exercises/entities/question-item.entity'
import { AnswerKey } from '@/features/exercises/entities/answer-key.entity'
import { CreateQuestionDto } from '@/features/exercises/dto/create-question.dto'
import { UpdateQuestionDto } from '@/features/exercises/dto/update-question.dto'
import { QuestionQueryDto } from '@/features/exercises/dto/question-query.dto'

/**
 * Service da feature "questions". CRUD de leitura/remoção vem do
 * BaseService; criação/edição ganham nomes próprios (`createQuestion`/
 * `updateQuestion`) em vez de sobrescrever `create`/`update` porque o
 * payload aceita `items: string[]` (textos das alternativas) e
 * `correctItemIndex` (índice da alternativa certa), que não batem com o
 * formato da entidade — o service separa esses campos: sincroniza as
 * QuestionItem à parte e grava o AnswerKey correspondente.
 *
 * `getAll`/`getById` nunca selecionam/joinam `AnswerKey` nem
 * `StudentAnswer` — o vínculo é só GRAVADO aqui, nunca lido de volta por
 * essas rotas (isolamento de propósito pra não vazar a resposta certa).
 */
@Injectable()
export class QuestionsService extends BaseService<Question> {
  constructor(
    @InjectRepository(Question) repository: Repository<Question>,
    @InjectRepository(QuestionItem) private readonly itemsRepository: Repository<QuestionItem>,
    @InjectRepository(AnswerKey) private readonly answerKeysRepository: Repository<AnswerKey>,
  ) {
    super(repository, 'Pergunta')
  }

  override async getAll(
    query: Partial<QuestionQueryDto> = {},
  ): Promise<PaginatedResponseDto<Question>> {
    const page = query.page ?? 1
    const perPage = query.perPage ?? 20
    const search = query.search?.trim()

    const scope: FindOptionsWhere<Question> = {}
    if (query.exerciseId) {
      scope.exerciseId = query.exerciseId
    }

    let where: FindOptionsWhere<Question> | FindOptionsWhere<Question>[] | undefined
    if (search) {
      where = [
        { ...scope, name: Like(`%${search}%`) },
        { ...scope, description: Like(`%${search}%`) },
      ]
    } else if (Object.keys(scope).length > 0) {
      where = scope
    }

    const [data, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: query.sort ? { [query.sort]: query.order ?? 'ASC' } : undefined,
    })

    return new PaginatedResponseDto(data, total, page, perPage)
  }

  override async getById(id: string): Promise<Question> {
    const question = await this.repository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.items', 'item')
      .where('question.id = :id', { id })
      .getOne()

    if (!question) {
      throw new NotFoundError('Pergunta', { id })
    }

    return question
  }

  async createQuestion(dto: CreateQuestionDto): Promise<Question> {
    const { items, correctItemIndex, correctText, ...data } = dto
    const question = await super.create(data)

    if (data.type === 'subjective') {
      if (correctText !== undefined) {
        await this.upsertAnswerKey(question.id, { correctText })
      }
    } else if (items?.length) {
      const created = await this.replaceItems(question.id, items)
      if (correctItemIndex !== undefined && created[correctItemIndex]) {
        await this.upsertAnswerKey(question.id, { correctItemId: created[correctItemIndex].id })
      }
    }

    return this.getById(question.id)
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto): Promise<Question> {
    const { items, correctItemIndex, correctText, ...data } = dto
    await super.update(id, data)

    if (data.type === 'subjective') {
      if (correctText !== undefined) {
        await this.upsertAnswerKey(id, { correctText })
      }
    } else if (items) {
      const created = await this.replaceItems(id, items)
      if (correctItemIndex !== undefined && created[correctItemIndex]) {
        await this.upsertAnswerKey(id, { correctItemId: created[correctItemIndex].id })
      }
    }

    return this.getById(id)
  }

  private async replaceItems(questionId: string, items: string[]): Promise<QuestionItem[]> {
    await this.itemsRepository.delete({ questionId })
    const entities = items.map((name) => this.itemsRepository.create({ name, questionId }))
    return this.itemsRepository.save(entities)
  }

  private async upsertAnswerKey(
    questionId: string,
    data: { correctItemId?: string; correctText?: string },
  ): Promise<void> {
    const existing = await this.answerKeysRepository.findOneBy({ questionId })
    if (existing) {
      Object.assign(existing, data)
      await this.answerKeysRepository.save(existing)
    } else {
      await this.answerKeysRepository.save(
        this.answerKeysRepository.create({ questionId, ...data }),
      )
    }
  }
}
