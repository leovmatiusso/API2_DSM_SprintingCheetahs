export const FILTRO_OS_ATRASADA_SQL =
  "o.os_status <> 'concluida' AND o.data_limite < CURRENT_DATE()";
