import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { OperacaoBaseDto } from './operacao-base.dto';

/** Corpo de POST /encomendas/:numero/linhas/:linha/fechar - equivalente a FecharLinhaEncomenda em Encomendas.cs. */
export class FecharLinhaEncomendaDto extends OperacaoBaseDto {
  @ApiProperty({ description: 'Sublinha/schedule line SAP a fechar' })
  @IsNumber()
  subLinha!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hardOrder?: boolean;

  @ApiProperty({ description: 'Entidade responsavel pelo fecho' })
  @IsString()
  entidade!: string;

  @ApiProperty({ description: 'Motivo do fecho' })
  @IsString()
  motivo!: string;

  @ApiPropertyOptional({ description: 'Codigo de materia-prima associado a linha' })
  @IsOptional()
  @IsString()
  codigoMP?: string;

  @ApiProperty({ description: 'Motivo de rejeicao SAP (REASON_REJ)' })
  @IsString()
  sapMotivoFecho!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  pedidoCompra?: boolean;
}
