import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateAnswerKeyDto {
  @ApiProperty({ format: 'uuid', description: 'Pergunta à qual esta resposta certa pertence' })
  @IsUUID()
  questionId!: string

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Alternativa correta — só quando a pergunta é objetiva',
  })
  @IsOptional()
  @IsUUID()
  correctItemId?: string

  @ApiPropertyOptional({
    description: 'Resposta esperada — só quando a pergunta é dissertativa',
  })
  @IsOptional()
  @IsString()
  correctText?: string
}
