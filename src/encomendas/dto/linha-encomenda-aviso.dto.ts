import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

/** Mapeia LinhasEncomendasAvisos usado em Encomendas.cs (ENCOMENDAS_CriaMantem_Linhas_Avisos). */
export class LinhaEncomendaAvisoDto {
  @ApiProperty({ description: 'Numero do item SAP a que o aviso se refere' })
  @IsNumber()
  linhaEncomenda!: number;

  @ApiProperty({ description: 'Numero da sublinha/schedule line a que o aviso se refere' })
  @IsNumber()
  subLinha!: number;

  @ApiProperty({ description: 'Identificador da mensagem de aviso' })
  @IsNumber()
  idMensagem!: number;
}
