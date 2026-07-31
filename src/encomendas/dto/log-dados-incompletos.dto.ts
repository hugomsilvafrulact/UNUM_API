import { ApiProperty } from '@nestjs/swagger';
import { EncomendaResultadoDto } from './encomenda-resultado.dto';

/** Mapeia SAP_EncomendaLogDadosIncompletos, devolvido por ORDER_INCOMPLETE em BAPI_SALESORDER_SIMULATE. */
export class LogDadosIncompletosDto {
  @ApiProperty()
  linhaEncomenda!: number;

  @ApiProperty()
  tabela!: string;

  @ApiProperty()
  campo!: string;

  @ApiProperty()
  mensagemErro!: string;
}

export class SimularEncomendaResponseDto extends EncomendaResultadoDto {
  @ApiProperty({ type: [LogDadosIncompletosDto] })
  linhasIncompletas!: LogDadosIncompletosDto[];
}
