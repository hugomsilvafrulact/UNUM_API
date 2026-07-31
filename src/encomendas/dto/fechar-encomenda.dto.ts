import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { OperacaoBaseDto } from './operacao-base.dto';

/** Corpo de POST /encomendas/:numero/fechar - equivalente a FecharEncomenda em Encomendas.cs. */
export class FecharEncomendaDto extends OperacaoBaseDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hardOrder?: boolean;

  @ApiProperty({ description: 'Motivo de rejeicao SAP (REASON_REJ) aplicado a todas as linhas por fechar' })
  @IsString()
  sapMotivoFecho!: string;
}
