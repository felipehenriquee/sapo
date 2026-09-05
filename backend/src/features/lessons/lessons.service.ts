import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto'
import { BaseService } from '@/common/services/base.service'
import { Lesson } from '@/features/lessons/entities/lesson.entity'
import { LessonQueryDto } from '@/features/lessons/dto/lesson-query.dto'

/**
 * Service da feature "lessons". CRUD padrão vem do BaseService; `getAll`
 * ganha os filtros `?unitId=`/`?type=`/`?courseId=` (este último via join
 * com `unit`, já que `courseId` não é coluna direta de Lesson) + a busca
 * livre `?search=`.
 */
@Injectable()
export class LessonsService extends BaseService<Lesson> {
  constructor(@InjectRepository(Lesson) repository: Repository<Lesson>) {
    super(repository, 'Aula')
  }

  override async getAll(
    query: Partial<LessonQueryDto> = {},
  ): Promise<PaginatedResponseDto<Lesson>> {
    const page = query.page ?? 1
    const perPage = query.perPage ?? 20
    const search = query.search?.trim()

    const qb = this.repository
      .createQueryBuilder('lesson')
      // `content` (HTML da aula) pode ser grande — fica de fora da listagem,
      // só é devolvido pelo getById (herdado do BaseService).
      .select([
        'lesson.id',
        'lesson.name',
        'lesson.description',
        'lesson.unitId',
        'lesson.type',
        'lesson.createdAt',
        'lesson.updatedAt',
      ])

    if (query.unitId) {
      qb.andWhere('lesson.unitId = :unitId', { unitId: query.unitId })
    }
    if (query.type) {
      qb.andWhere('lesson.type = :type', { type: query.type })
    }
    if (query.courseId) {
      qb.leftJoin('lesson.unit', 'unit').andWhere('unit.courseId = :courseId', {
        courseId: query.courseId,
      })
    }
    if (search) {
      qb.andWhere('(lesson.name LIKE :search OR lesson.description LIKE :search)', {
        search: `%${search}%`,
      })
    }

    if (query.sort) {
      qb.orderBy(`lesson.${query.sort}`, query.order ?? 'ASC')
    }

    const [data, total] = await qb
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount()

    return new PaginatedResponseDto(data, total, page, perPage)
  }
}
