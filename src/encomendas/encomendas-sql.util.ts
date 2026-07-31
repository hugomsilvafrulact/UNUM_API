/** Replica String.Format("{0:dd/MM/yyyy}", ...) usado em Encomendas.cs antes de passar datas as stored procedures. */
export function formatDateDdMmYyyy(date?: Date): string {
  if (!date) return '';

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

/** Replica String.Format("{0:MM/dd/yyyy}", ...) usado nas chamadas GO_*PedidoEnvioAmostra*. */
export function formatDateMmDdYyyy(date?: Date): string {
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
