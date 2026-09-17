export interface OrdemServico {
    os_id: number;
    os_titulo: string;
    os_descricao: string;
    os_status: 'aberta' | 'em andamento' | 'concluida';
    prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    os_cliente: string;
    data_limite: string;
    id_criador: number;
    id_time_responsavel: number | null;
}