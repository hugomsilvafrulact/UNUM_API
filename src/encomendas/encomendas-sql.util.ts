/**
 * Formata a data para "MM/dd/yyyy" antes de a passar como string a uma stored procedure.
 * Confirmado com o dono das stored procedures (2026-09-22): a sessao SQL do login SalesOrderAPI
 * espera datas neste formato (DATEFORMAT mdy), independentemente do que Encomendas.cs usava
 * originalmente para o login da app desktop.
 */
export function formatDateSql(date?: Date): string {
  if (!date) return '';

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
}

/** Replica os `Bool ? "1" : "0"` usados em Encomendas.cs ao chamar as stored procedures UNUM. */
export function bit(value?: boolean): string {
  return value ? '1' : '0';
}

/** Replica `.PadLeft(10, '0')` usado em Encomendas.cs para numeros de entidade/encomenda SAP. */
export function padSapNumber(value: string, length = 10): string {
  return value.padStart(length, '0');
}
