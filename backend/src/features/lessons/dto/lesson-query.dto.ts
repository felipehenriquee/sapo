import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsUUID } from 'class-validator'

import { PaginationQueryDto } from '@/common/dto/pagination-query.dto'
import { LessonType } from '@/features/lessons/entities/lesson.entity'

/** Query de listagem de aulas: paginação/busca + filtros de unidade/curso/tipo. */
export class LessonQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filtra aulas por unidade' })
  @IsOptional()
  @IsUUID()
  unitId?: string

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filtra aulas por curso (join via unit.courseId)',
  })
  @IsOptional()
  @IsUUID()
  courseId?: string

  @ApiPropertyOptional({ enum: ['content', 'exercise'], description: 'Filtra aulas por tipo' })
  @IsOptional()
  @IsIn(['content', 'exercise'])
  type?: LessonType
}
