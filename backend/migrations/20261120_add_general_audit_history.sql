-- Apply once to an existing API2 database to enable general audit history.
-- Run with a MySQL client that supports DELIMITER (for example mysql CLI).
CREATE TABLE IF NOT EXISTS historico_registros (
  historico_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tabela VARCHAR(64) NOT NULL,
  registro_id VARCHAR(100) NOT NULL,
  tipo_acao ENUM('criado', 'atualizado', 'deletado') NOT NULL,
  dados JSON NOT NULL,
  data_historico DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_historico_tabela_registro (tabela, registro_id),
  INDEX idx_historico_data (data_historico)
) ENGINE=InnoDB;

-- Upgrade the previous OS history table name when it is present.
SET @tem_historico_antigo = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'historico');
SET @tem_historico_os = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'historico_os');
SET @renomeia_historico = IF(@tem_historico_antigo > 0 AND @tem_historico_os = 0, 'RENAME TABLE historico TO historico_os', 'SELECT 1');
PREPARE migracao_historico FROM @renomeia_historico;
EXECUTE migracao_historico;
DEALLOCATE PREPARE migracao_historico;

DELIMITER //
CREATE TRIGGER trg_hist_usuarios_insert
    AFTER INSERT ON usuarios
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('usuarios', CAST(NEW.id_usuario AS CHAR), 'criado', JSON_OBJECT('id_usuario', NEW.id_usuario, 'nome', NEW.nome, 'email', NEW.email, 'cargo', NEW.cargo, 'ativo', NEW.ativo, 'time_id', NEW.time_id, 'data_criacao', NEW.data_criacao));
    END //
CREATE TRIGGER trg_hist_usuarios_update
    AFTER UPDATE ON usuarios
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('usuarios', CAST(NEW.id_usuario AS CHAR), 'atualizado', JSON_OBJECT('id_usuario', NEW.id_usuario, 'nome', NEW.nome, 'email', NEW.email, 'cargo', NEW.cargo, 'ativo', NEW.ativo, 'time_id', NEW.time_id, 'data_criacao', NEW.data_criacao));
    END //
CREATE TRIGGER trg_hist_usuarios_delete
    AFTER DELETE ON usuarios
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('usuarios', CAST(OLD.id_usuario AS CHAR), 'deletado', JSON_OBJECT('id_usuario', OLD.id_usuario, 'nome', OLD.nome, 'email', OLD.email, 'cargo', OLD.cargo, 'ativo', OLD.ativo, 'time_id', OLD.time_id, 'data_criacao', OLD.data_criacao));
    END //
CREATE TRIGGER trg_hist_time_insert
    AFTER INSERT ON time
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('time', CAST(NEW.id_time AS CHAR), 'criado', JSON_OBJECT('id_time', NEW.id_time, 'nome_time', NEW.nome_time, 'email_time', NEW.email_time, 'departamento', NEW.departamento, 'responsavel_id', NEW.responsavel_id));
    END //
CREATE TRIGGER trg_hist_time_update
    AFTER UPDATE ON time
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('time', CAST(NEW.id_time AS CHAR), 'atualizado', JSON_OBJECT('id_time', NEW.id_time, 'nome_time', NEW.nome_time, 'email_time', NEW.email_time, 'departamento', NEW.departamento, 'responsavel_id', NEW.responsavel_id));
    END //
CREATE TRIGGER trg_hist_time_delete
    AFTER DELETE ON time
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('time', CAST(OLD.id_time AS CHAR), 'deletado', JSON_OBJECT('id_time', OLD.id_time, 'nome_time', OLD.nome_time, 'email_time', OLD.email_time, 'departamento', OLD.departamento, 'responsavel_id', OLD.responsavel_id));
    END //
CREATE TRIGGER trg_hist_projetos_insert
    AFTER INSERT ON projetos
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('projetos', CAST(NEW.projeto_id AS CHAR), 'criado', JSON_OBJECT('projeto_id', NEW.projeto_id, 'nome', NEW.nome, 'data_assinatura_contrato', NEW.data_assinatura_contrato, 'data_implantacao', NEW.data_implantacao, 'data_vencimento_contrato', NEW.data_vencimento_contrato, 'data_limite', NEW.data_limite, 'responsavel_id', NEW.responsavel_id, 'vendedor_id', NEW.vendedor_id, 'tipo_sistema', NEW.tipo_sistema, 'prioridade', NEW.prioridade, 'status', NEW.status, 'descricao', NEW.descricao, 'data_criacao', NEW.data_criacao));
    END //
CREATE TRIGGER trg_hist_projetos_update
    AFTER UPDATE ON projetos
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('projetos', CAST(NEW.projeto_id AS CHAR), 'atualizado', JSON_OBJECT('projeto_id', NEW.projeto_id, 'nome', NEW.nome, 'data_assinatura_contrato', NEW.data_assinatura_contrato, 'data_implantacao', NEW.data_implantacao, 'data_vencimento_contrato', NEW.data_vencimento_contrato, 'data_limite', NEW.data_limite, 'responsavel_id', NEW.responsavel_id, 'vendedor_id', NEW.vendedor_id, 'tipo_sistema', NEW.tipo_sistema, 'prioridade', NEW.prioridade, 'status', NEW.status, 'descricao', NEW.descricao, 'data_criacao', NEW.data_criacao));
    END //
CREATE TRIGGER trg_hist_projetos_delete
    AFTER DELETE ON projetos
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('projetos', CAST(OLD.projeto_id AS CHAR), 'deletado', JSON_OBJECT('projeto_id', OLD.projeto_id, 'nome', OLD.nome, 'data_assinatura_contrato', OLD.data_assinatura_contrato, 'data_implantacao', OLD.data_implantacao, 'data_vencimento_contrato', OLD.data_vencimento_contrato, 'data_limite', OLD.data_limite, 'responsavel_id', OLD.responsavel_id, 'vendedor_id', OLD.vendedor_id, 'tipo_sistema', OLD.tipo_sistema, 'prioridade', OLD.prioridade, 'status', OLD.status, 'descricao', OLD.descricao, 'data_criacao', OLD.data_criacao));
    END //
CREATE TRIGGER trg_hist_manutencoes_insert
    AFTER INSERT ON manutencoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('manutencoes', CAST(NEW.manutencao_id AS CHAR), 'criado', JSON_OBJECT('manutencao_id', NEW.manutencao_id, 'data_inicio_problema', NEW.data_inicio_problema, 'tipo_manutencao', NEW.tipo_manutencao, 'descricao_situacao', NEW.descricao_situacao, 'status', NEW.status, 'data_criacao', NEW.data_criacao, 'projeto_id', NEW.projeto_id, 'resumo', NEW.resumo, 'responsavel_id', NEW.responsavel_id, 'data_limite', NEW.data_limite, 'prioridade', NEW.prioridade));
    END //
CREATE TRIGGER trg_hist_manutencoes_update
    AFTER UPDATE ON manutencoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('manutencoes', CAST(NEW.manutencao_id AS CHAR), 'atualizado', JSON_OBJECT('manutencao_id', NEW.manutencao_id, 'data_inicio_problema', NEW.data_inicio_problema, 'tipo_manutencao', NEW.tipo_manutencao, 'descricao_situacao', NEW.descricao_situacao, 'status', NEW.status, 'data_criacao', NEW.data_criacao, 'projeto_id', NEW.projeto_id, 'resumo', NEW.resumo, 'responsavel_id', NEW.responsavel_id, 'data_limite', NEW.data_limite, 'prioridade', NEW.prioridade));
    END //
CREATE TRIGGER trg_hist_manutencoes_delete
    AFTER DELETE ON manutencoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('manutencoes', CAST(OLD.manutencao_id AS CHAR), 'deletado', JSON_OBJECT('manutencao_id', OLD.manutencao_id, 'data_inicio_problema', OLD.data_inicio_problema, 'tipo_manutencao', OLD.tipo_manutencao, 'descricao_situacao', OLD.descricao_situacao, 'status', OLD.status, 'data_criacao', OLD.data_criacao, 'projeto_id', OLD.projeto_id, 'resumo', OLD.resumo, 'responsavel_id', OLD.responsavel_id, 'data_limite', OLD.data_limite, 'prioridade', OLD.prioridade));
    END //
CREATE TRIGGER trg_hist_item_equipamento_os_insert
    AFTER INSERT ON item_equipamento_os
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('item_equipamento_os', CONCAT(NEW.os_id, ':', NEW.equipamento_id), 'criado', JSON_OBJECT('os_id', NEW.os_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade));
    END //
CREATE TRIGGER trg_hist_item_equipamento_os_update
    AFTER UPDATE ON item_equipamento_os
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('item_equipamento_os', CONCAT(NEW.os_id, ':', NEW.equipamento_id), 'atualizado', JSON_OBJECT('os_id', NEW.os_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade));
    END //
CREATE TRIGGER trg_hist_item_equipamento_os_delete
    AFTER DELETE ON item_equipamento_os
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('item_equipamento_os', CONCAT(OLD.os_id, ':', OLD.equipamento_id), 'deletado', JSON_OBJECT('os_id', OLD.os_id, 'equipamento_id', OLD.equipamento_id, 'quantidade', OLD.quantidade));
    END //
CREATE TRIGGER trg_hist_item_equipamento_projeto_insert
    AFTER INSERT ON item_equipamento_projeto
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('item_equipamento_projeto', CONCAT(NEW.projeto_id, ':', NEW.equipamento_id), 'criado', JSON_OBJECT('projeto_id', NEW.projeto_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade));
    END //
CREATE TRIGGER trg_hist_item_equipamento_projeto_update
    AFTER UPDATE ON item_equipamento_projeto
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('item_equipamento_projeto', CONCAT(NEW.projeto_id, ':', NEW.equipamento_id), 'atualizado', JSON_OBJECT('projeto_id', NEW.projeto_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade));
    END //
CREATE TRIGGER trg_hist_item_equipamento_projeto_delete
    AFTER DELETE ON item_equipamento_projeto
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('item_equipamento_projeto', CONCAT(OLD.projeto_id, ':', OLD.equipamento_id), 'deletado', JSON_OBJECT('projeto_id', OLD.projeto_id, 'equipamento_id', OLD.equipamento_id, 'quantidade', OLD.quantidade));
    END //
CREATE TRIGGER trg_hist_item_equipamento_manutencao_insert
    AFTER INSERT ON item_equipamento_manutencao
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('item_equipamento_manutencao', CONCAT(NEW.manutencao_id, ':', NEW.equipamento_id), 'criado', JSON_OBJECT('manutencao_id', NEW.manutencao_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade));
    END //
CREATE TRIGGER trg_hist_item_equipamento_manutencao_update
    AFTER UPDATE ON item_equipamento_manutencao
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('item_equipamento_manutencao', CONCAT(NEW.manutencao_id, ':', NEW.equipamento_id), 'atualizado', JSON_OBJECT('manutencao_id', NEW.manutencao_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade));
    END //
CREATE TRIGGER trg_hist_item_equipamento_manutencao_delete
    AFTER DELETE ON item_equipamento_manutencao
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('item_equipamento_manutencao', CONCAT(OLD.manutencao_id, ':', OLD.equipamento_id), 'deletado', JSON_OBJECT('manutencao_id', OLD.manutencao_id, 'equipamento_id', OLD.equipamento_id, 'quantidade', OLD.quantidade));
    END //
CREATE TRIGGER trg_hist_notificacoes_insert
    AFTER INSERT ON notificacoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('notificacoes', CAST(NEW.notificacao_id AS CHAR), 'criado', JSON_OBJECT('notificacao_id', NEW.notificacao_id, 'titulo', NEW.titulo, 'mensagem', NEW.mensagem, 'time_id', NEW.time_id, 'os_id', NEW.os_id, 'usuario_origem_id', NEW.usuario_origem_id, 'data_criacao', NEW.data_criacao));
    END //
CREATE TRIGGER trg_hist_notificacoes_update
    AFTER UPDATE ON notificacoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('notificacoes', CAST(NEW.notificacao_id AS CHAR), 'atualizado', JSON_OBJECT('notificacao_id', NEW.notificacao_id, 'titulo', NEW.titulo, 'mensagem', NEW.mensagem, 'time_id', NEW.time_id, 'os_id', NEW.os_id, 'usuario_origem_id', NEW.usuario_origem_id, 'data_criacao', NEW.data_criacao));
    END //
CREATE TRIGGER trg_hist_notificacoes_delete
    AFTER DELETE ON notificacoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('notificacoes', CAST(OLD.notificacao_id AS CHAR), 'deletado', JSON_OBJECT('notificacao_id', OLD.notificacao_id, 'titulo', OLD.titulo, 'mensagem', OLD.mensagem, 'time_id', OLD.time_id, 'os_id', OLD.os_id, 'usuario_origem_id', OLD.usuario_origem_id, 'data_criacao', OLD.data_criacao));
    END //
CREATE TRIGGER trg_hist_notificacao_leituras_insert
    AFTER INSERT ON notificacao_leituras
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('notificacao_leituras', CONCAT(NEW.notificacao_id, ':', NEW.usuario_id), 'criado', JSON_OBJECT('notificacao_id', NEW.notificacao_id, 'usuario_id', NEW.usuario_id, 'data_leitura', NEW.data_leitura));
    END //
CREATE TRIGGER trg_hist_notificacao_leituras_update
    AFTER UPDATE ON notificacao_leituras
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('notificacao_leituras', CONCAT(NEW.notificacao_id, ':', NEW.usuario_id), 'atualizado', JSON_OBJECT('notificacao_id', NEW.notificacao_id, 'usuario_id', NEW.usuario_id, 'data_leitura', NEW.data_leitura));
    END //
CREATE TRIGGER trg_hist_notificacao_leituras_delete
    AFTER DELETE ON notificacao_leituras
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('notificacao_leituras', CONCAT(OLD.notificacao_id, ':', OLD.usuario_id), 'deletado', JSON_OBJECT('notificacao_id', OLD.notificacao_id, 'usuario_id', OLD.usuario_id, 'data_leitura', OLD.data_leitura));
    END //
CREATE TRIGGER trg_audit_os_insert AFTER INSERT ON os FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('os', CAST(NEW.os_id AS CHAR), 'criado', JSON_OBJECT('os_id', NEW.os_id, 'os_titulo', NEW.os_titulo, 'os_status', NEW.os_status, 'prioridade', NEW.prioridade, 'data_limite', NEW.data_limite, 'id_criador', NEW.id_criador, 'id_time_responsavel', NEW.id_time_responsavel, 'projeto_id', NEW.projeto_id, 'manutencao_id', NEW.manutencao_id));
END //
CREATE TRIGGER trg_audit_os_update AFTER UPDATE ON os FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('os', CAST(NEW.os_id AS CHAR), 'atualizado', JSON_OBJECT('os_id', NEW.os_id, 'os_titulo', NEW.os_titulo, 'os_status', NEW.os_status, 'prioridade', NEW.prioridade, 'data_limite', NEW.data_limite, 'id_criador', NEW.id_criador, 'id_time_responsavel', NEW.id_time_responsavel, 'projeto_id', NEW.projeto_id, 'manutencao_id', NEW.manutencao_id));
END //
CREATE TRIGGER trg_audit_os_delete AFTER DELETE ON os FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('os', CAST(OLD.os_id AS CHAR), 'deletado', JSON_OBJECT('os_id', OLD.os_id, 'os_titulo', OLD.os_titulo, 'os_status', OLD.os_status, 'prioridade', OLD.prioridade, 'data_limite', OLD.data_limite, 'id_criador', OLD.id_criador, 'id_time_responsavel', OLD.id_time_responsavel, 'projeto_id', OLD.projeto_id, 'manutencao_id', OLD.manutencao_id));
END //
CREATE TRIGGER trg_audit_equipamentos_insert AFTER INSERT ON equipamentos FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('equipamentos', CAST(NEW.equipamento_id AS CHAR), 'criado', JSON_OBJECT('equipamento_id', NEW.equipamento_id, 'nome_equipamento', NEW.nome_equipamento));
END //
CREATE TRIGGER trg_audit_equipamentos_update AFTER UPDATE ON equipamentos FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('equipamentos', CAST(NEW.equipamento_id AS CHAR), 'atualizado', JSON_OBJECT('equipamento_id', NEW.equipamento_id, 'nome_equipamento', NEW.nome_equipamento));
END //
CREATE TRIGGER trg_audit_equipamentos_delete AFTER DELETE ON equipamentos FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('equipamentos', CAST(OLD.equipamento_id AS CHAR), 'deletado', JSON_OBJECT('equipamento_id', OLD.equipamento_id, 'nome_equipamento', OLD.nome_equipamento));
END //
CREATE TRIGGER trg_audit_anexo_insert AFTER INSERT ON anexo FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('anexo', CAST(NEW.anexo_id AS CHAR), 'criado', JSON_OBJECT('anexo_id', NEW.anexo_id, 'os_id', NEW.os_id, 'manutencao_id', NEW.manutencao_id, 'projeto_id', NEW.projeto_id, 'nome_anexo', NEW.nome_anexo, 'anexo_tipo', NEW.anexo_tipo, 'data_anexo', NEW.data_anexo));
END //
CREATE TRIGGER trg_audit_anexo_update AFTER UPDATE ON anexo FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('anexo', CAST(NEW.anexo_id AS CHAR), 'atualizado', JSON_OBJECT('anexo_id', NEW.anexo_id, 'os_id', NEW.os_id, 'manutencao_id', NEW.manutencao_id, 'projeto_id', NEW.projeto_id, 'nome_anexo', NEW.nome_anexo, 'anexo_tipo', NEW.anexo_tipo, 'data_anexo', NEW.data_anexo));
END //
CREATE TRIGGER trg_audit_anexo_delete AFTER DELETE ON anexo FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados) VALUES ('anexo', CAST(OLD.anexo_id AS CHAR), 'deletado', JSON_OBJECT('anexo_id', OLD.anexo_id, 'os_id', OLD.os_id, 'manutencao_id', OLD.manutencao_id, 'projeto_id', OLD.projeto_id, 'nome_anexo', OLD.nome_anexo, 'anexo_tipo', OLD.anexo_tipo, 'data_anexo', OLD.data_anexo));
END //

DELIMITER ;
