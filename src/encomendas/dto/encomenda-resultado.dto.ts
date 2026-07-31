import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParceiroEncomendaResponseDto } from './parceiro-encomenda.dto';

export class EncomendaResultadoDto {
  @ApiProperty({ description: 'Indica se a operacao foi concluida com sucesso em SAP e UNUM' })
  sucesso!: boolean;

  @ApiPropertyOptional({ description: 'Mensagens de erro devolvidas por SAP (RETURN) ou pela camada UNUM' })
  mensagemErro?: string;
}

export class CriarEncomendaResponseDto extends EncomendaResultadoDto {
  @ApiPropertyOptional({ description: 'Numero de encomenda SAP criado (vazio em modo simulacao ou insucesso)' })
  numeroEncomenda?: string;

  @ApiPropertyOptional({
    type: [ParceiroEncomendaResponseDto],
    description: 'Parceiros com o SAP_Endereco atribuido por SAP (contas CPD)',
  })
  parceiros?: ParceiroEncomendaResponseDto[];
}
