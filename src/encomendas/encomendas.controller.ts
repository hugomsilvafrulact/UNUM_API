import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EncomendasService } from './encomendas.service';
import { CriarEncomendaDto } from './dto/criar-encomenda.dto';
import { CriarEncomendaResponseDto, EncomendaResultadoDto } from './dto/encomenda-resultado.dto';
import { SimularEncomendaDto } from './dto/simular-encomenda.dto';
import { SimularEncomendaResponseDto } from './dto/log-dados-incompletos.dto';
import { AlterarEncomendaDto } from './dto/alterar-encomenda.dto';
import { EliminarEncomendaDto } from './dto/eliminar-encomenda.dto';
import { FecharEncomendaDto } from './dto/fechar-encomenda.dto';
import { FecharLinhaEncomendaDto } from './dto/fechar-linha-encomenda.dto';

@ApiTags('encomendas')
@Controller('encomendas')
export class EncomendasController {
  constructor(private readonly encomendasService: EncomendasService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma encomenda em SAP e UNUM (BAPI_SALESORDER_CREATEFROMDAT2)' })
  @ApiOkResponse({ type: CriarEncomendaResponseDto })
  criar(@Body() dto: CriarEncomendaDto): Promise<CriarEncomendaResponseDto> {
    return this.encomendasService.criar(dto);
  }

  @Post('simulacao')
  @ApiOperation({ summary: 'Simula a criacao de uma encomenda sem a persistir (BAPI_SALESORDER_SIMULATE)' })
  @ApiOkResponse({ type: SimularEncomendaResponseDto })
  simular(@Body() dto: SimularEncomendaDto): Promise<SimularEncomendaResponseDto> {
    return this.encomendasService.simular(dto);
  }

  @Patch(':numero')
  @ApiOperation({ summary: 'Altera uma encomenda existente em SAP e UNUM (BAPI_SALESORDER_CHANGE)' })
  @ApiOkResponse({ type: EncomendaResultadoDto })
  alterar(@Param('numero') numero: string, @Body() dto: AlterarEncomendaDto): Promise<EncomendaResultadoDto> {
    return this.encomendasService.alterar(numero, dto);
  }

  @Delete(':numero')
  @ApiOperation({ summary: 'Elimina/anula uma encomenda em SAP e UNUM' })
  @ApiBody({ type: EliminarEncomendaDto })
  @ApiOkResponse({ type: EncomendaResultadoDto })
  eliminar(@Param('numero') numero: string, @Body() dto: EliminarEncomendaDto): Promise<EncomendaResultadoDto> {
    return this.encomendasService.eliminar(numero, dto);
  }

  @Post(':numero/fechar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fecha todas as linhas em aberto de uma encomenda' })
  @ApiOkResponse({ type: EncomendaResultadoDto })
  fechar(@Param('numero') numero: string, @Body() dto: FecharEncomendaDto): Promise<EncomendaResultadoDto> {
    return this.encomendasService.fechar(numero, dto);
  }

  @Post(':numero/linhas/:linha/fechar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fecha uma linha especifica de uma encomenda' })
  @ApiOkResponse({ type: EncomendaResultadoDto })
  fecharLinha(
    @Param('numero') numero: string,
    @Param('linha') linha: string,
    @Body() dto: FecharLinhaEncomendaDto,
  ): Promise<EncomendaResultadoDto> {
    return this.encomendasService.fecharLinha(numero, linha, dto);
  }
}
