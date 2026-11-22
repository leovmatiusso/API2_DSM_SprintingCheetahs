-- Add actor snapshots to existing general and OS histories, then refresh all audit triggers.
-- Apply after 20261120_add_general_audit_history.sql using mysql CLI (supports DELIMITER).
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'historico_registros' AND column_name = 'usuario_id') = 0, 'ALTER TABLE historico_registros ADD COLUMN usuario_id INT NULL', 'SELECT 1');
PREPARE audit_migration FROM @ddl; EXECUTE audit_migration; DEALLOCATE PREPARE audit_migration;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'historico_registros' AND column_name = 'usuario_email') = 0, 'ALTER TABLE historico_registros ADD COLUMN usuario_email VARCHAR(150) NULL', 'SELECT 1');
PREPARE audit_migration FROM @ddl; EXECUTE audit_migration; DEALLOCATE PREPARE audit_migration;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'historico_os' AND column_name = 'usuario_id') = 0, 'ALTER TABLE historico_os ADD COLUMN usuario_id INT NULL', 'SELECT 1');
PREPARE audit_migration FROM @ddl; EXECUTE audit_migration; DEALLOCATE PREPARE audit_migration;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'historico_os' AND column_name = 'usuario_email') = 0, 'ALTER TABLE historico_os ADD COLUMN usuario_email VARCHAR(150) NULL', 'SELECT 1');
PREPARE audit_migration FROM @ddl; EXECUTE audit_migration; DEALLOCATE PREPARE audit_migration;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'historico_os' AND column_name = 'data_historico') = 0, 'ALTER TABLE historico_os ADD COLUMN data_historico DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE audit_migration FROM @ddl; EXECUTE audit_migration; DEALLOCATE PREPARE audit_migration;

-- Recover email addresses for earlier events when the actor account still exists.
UPDATE historico_registros h
JOIN usuarios u ON u.id_usuario = h.usuario_id
   SET h.usuario_email = u.email
 WHERE h.usuario_email IS NULL;

UPDATE historico_os h
JOIN usuarios u ON u.id_usuario = h.usuario_id
   SET h.usuario_email = u.email
 WHERE h.usuario_email IS NULL;

DROP TRIGGER IF EXISTS trg_hist_usuarios_insert;
DROP TRIGGER IF EXISTS trg_hist_usuarios_update;
DROP TRIGGER IF EXISTS trg_hist_usuarios_delete;
DROP TRIGGER IF EXISTS trg_hist_time_insert;
DROP TRIGGER IF EXISTS trg_hist_time_update;
DROP TRIGGER IF EXISTS trg_hist_time_delete;
DROP TRIGGER IF EXISTS trg_hist_projetos_insert;
DROP TRIGGER IF EXISTS trg_hist_projetos_update;
DROP TRIGGER IF EXISTS trg_hist_projetos_delete;
DROP TRIGGER IF EXISTS trg_hist_manutencoes_insert;
DROP TRIGGER IF EXISTS trg_hist_manutencoes_update;
DROP TRIGGER IF EXISTS trg_hist_manutencoes_delete;
DROP TRIGGER IF EXISTS trg_hist_item_equipamento_os_insert;
DROP TRIGGER IF EXISTS trg_hist_item_equipamento_os_update;
DROP TRIGGER IF EXISTS trg_hist_item_equipamento_os_delete;
DROP TRIGGER IF EXISTS trg_hist_item_equipamento_projeto_insert;
DROP TRIGGER IF EXISTS trg_hist_item_equipamento_projeto_update;
DROP TRIGGER IF EXISTS trg_hist_item_equipamento_projeto_delete;
DROP TRIGGER IF EXISTS trg_hist_item_equipamento_manutencao_insert;
DROP TRIGGER IF EXISTS trg_hist_item_equipamento_manutencao_update;
DROP TRIGGER IF EXISTS trg_hist_item_equipamento_manutencao_delete;
DROP TRIGGER IF EXISTS trg_hist_notificacoes_insert;
DROP TRIGGER IF EXISTS trg_hist_notificacoes_update;
DROP TRIGGER IF EXISTS trg_hist_notificacoes_delete;
DROP TRIGGER IF EXISTS trg_hist_notificacao_leituras_insert;
DROP TRIGGER IF EXISTS trg_hist_notificacao_leituras_update;
DROP TRIGGER IF EXISTS trg_hist_notificacao_leituras_delete;
DROP TRIGGER IF EXISTS trg_audit_os_insert;
DROP TRIGGER IF EXISTS trg_audit_os_update;
DROP TRIGGER IF EXISTS trg_audit_os_delete;
DROP TRIGGER IF EXISTS trg_audit_equipamentos_insert;
DROP TRIGGER IF EXISTS trg_audit_equipamentos_update;
DROP TRIGGER IF EXISTS trg_audit_equipamentos_delete;
DROP TRIGGER IF EXISTS trg_audit_anexo_insert;
DROP TRIGGER IF EXISTS trg_audit_anexo_update;
DROP TRIGGER IF EXISTS trg_audit_anexo_delete;
DROP TRIGGER IF EXISTS trg_insert_os;
DROP TRIGGER IF EXISTS trg_update_os;
DROP TRIGGER IF EXISTS trg_delete_os;

DELIMITER //
CREATE TRIGGER trg_hist_usuarios_insert
    AFTER INSERT ON usuarios
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('usuarios', CAST(NEW.id_usuario AS CHAR), 'criado', JSON_OBJECT('id_usuario', NEW.id_usuario, 'nome', NEW.nome, 'email', NEW.email, 'cargo', NEW.cargo, 'ativo', NEW.ativo, 'time_id', NEW.time_id, 'data_criacao', NEW.data_criacao), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_usuarios_update
    AFTER UPDATE ON usuarios
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('usuarios', CAST(NEW.id_usuario AS CHAR), 'atualizado', JSON_OBJECT('id_usuario', NEW.id_usuario, 'nome', NEW.nome, 'email', NEW.email, 'cargo', NEW.cargo, 'ativo', NEW.ativo, 'time_id', NEW.time_id, 'data_criacao', NEW.data_criacao), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_usuarios_delete
    AFTER DELETE ON usuarios
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('usuarios', CAST(OLD.id_usuario AS CHAR), 'deletado', JSON_OBJECT('id_usuario', OLD.id_usuario, 'nome', OLD.nome, 'email', OLD.email, 'cargo', OLD.cargo, 'ativo', OLD.ativo, 'time_id', OLD.time_id, 'data_criacao', OLD.data_criacao), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_time_insert
    AFTER INSERT ON time
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('time', CAST(NEW.id_time AS CHAR), 'criado', JSON_OBJECT('id_time', NEW.id_time, 'nome_time', NEW.nome_time, 'email_time', NEW.email_time, 'departamento', NEW.departamento, 'responsavel_id', NEW.responsavel_id), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_time_update
    AFTER UPDATE ON time
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('time', CAST(NEW.id_time AS CHAR), 'atualizado', JSON_OBJECT('id_time', NEW.id_time, 'nome_time', NEW.nome_time, 'email_time', NEW.email_time, 'departamento', NEW.departamento, 'responsavel_id', NEW.responsavel_id), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_time_delete
    AFTER DELETE ON time
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('time', CAST(OLD.id_time AS CHAR), 'deletado', JSON_OBJECT('id_time', OLD.id_time, 'nome_time', OLD.nome_time, 'email_time', OLD.email_time, 'departamento', OLD.departamento, 'responsavel_id', OLD.responsavel_id), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_projetos_insert
    AFTER INSERT ON projetos
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('projetos', CAST(NEW.projeto_id AS CHAR), 'criado', JSON_OBJECT('projeto_id', NEW.projeto_id, 'nome', NEW.nome, 'data_assinatura_contrato', NEW.data_assinatura_contrato, 'data_implantacao', NEW.data_implantacao, 'data_vencimento_contrato', NEW.data_vencimento_contrato, 'data_limite', NEW.data_limite, 'responsavel_id', NEW.responsavel_id, 'vendedor_id', NEW.vendedor_id, 'tipo_sistema', NEW.tipo_sistema, 'prioridade', NEW.prioridade, 'status', NEW.status, 'descricao', NEW.descricao, 'data_criacao', NEW.data_criacao), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_projetos_update
    AFTER UPDATE ON projetos
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('projetos', CAST(NEW.projeto_id AS CHAR), 'atualizado', JSON_OBJECT('projeto_id', NEW.projeto_id, 'nome', NEW.nome, 'data_assinatura_contrato', NEW.data_assinatura_contrato, 'data_implantacao', NEW.data_implantacao, 'data_vencimento_contrato', NEW.data_vencimento_contrato, 'data_limite', NEW.data_limite, 'responsavel_id', NEW.responsavel_id, 'vendedor_id', NEW.vendedor_id, 'tipo_sistema', NEW.tipo_sistema, 'prioridade', NEW.prioridade, 'status', NEW.status, 'descricao', NEW.descricao, 'data_criacao', NEW.data_criacao), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_projetos_delete
    AFTER DELETE ON projetos
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('projetos', CAST(OLD.projeto_id AS CHAR), 'deletado', JSON_OBJECT('projeto_id', OLD.projeto_id, 'nome', OLD.nome, 'data_assinatura_contrato', OLD.data_assinatura_contrato, 'data_implantacao', OLD.data_implantacao, 'data_vencimento_contrato', OLD.data_vencimento_contrato, 'data_limite', OLD.data_limite, 'responsavel_id', OLD.responsavel_id, 'vendedor_id', OLD.vendedor_id, 'tipo_sistema', OLD.tipo_sistema, 'prioridade', OLD.prioridade, 'status', OLD.status, 'descricao', OLD.descricao, 'data_criacao', OLD.data_criacao), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_manutencoes_insert
    AFTER INSERT ON manutencoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('manutencoes', CAST(NEW.manutencao_id AS CHAR), 'criado', JSON_OBJECT('manutencao_id', NEW.manutencao_id, 'data_inicio_problema', NEW.data_inicio_problema, 'tipo_manutencao', NEW.tipo_manutencao, 'descricao_situacao', NEW.descricao_situacao, 'status', NEW.status, 'data_criacao', NEW.data_criacao, 'projeto_id', NEW.projeto_id, 'resumo', NEW.resumo, 'responsavel_id', NEW.responsavel_id, 'data_limite', NEW.data_limite, 'prioridade', NEW.prioridade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_manutencoes_update
    AFTER UPDATE ON manutencoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('manutencoes', CAST(NEW.manutencao_id AS CHAR), 'atualizado', JSON_OBJECT('manutencao_id', NEW.manutencao_id, 'data_inicio_problema', NEW.data_inicio_problema, 'tipo_manutencao', NEW.tipo_manutencao, 'descricao_situacao', NEW.descricao_situacao, 'status', NEW.status, 'data_criacao', NEW.data_criacao, 'projeto_id', NEW.projeto_id, 'resumo', NEW.resumo, 'responsavel_id', NEW.responsavel_id, 'data_limite', NEW.data_limite, 'prioridade', NEW.prioridade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_manutencoes_delete
    AFTER DELETE ON manutencoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('manutencoes', CAST(OLD.manutencao_id AS CHAR), 'deletado', JSON_OBJECT('manutencao_id', OLD.manutencao_id, 'data_inicio_problema', OLD.data_inicio_problema, 'tipo_manutencao', OLD.tipo_manutencao, 'descricao_situacao', OLD.descricao_situacao, 'status', OLD.status, 'data_criacao', OLD.data_criacao, 'projeto_id', OLD.projeto_id, 'resumo', OLD.resumo, 'responsavel_id', OLD.responsavel_id, 'data_limite', OLD.data_limite, 'prioridade', OLD.prioridade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_item_equipamento_os_insert
    AFTER INSERT ON item_equipamento_os
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('item_equipamento_os', CONCAT(NEW.os_id, ':', NEW.equipamento_id), 'criado', JSON_OBJECT('os_id', NEW.os_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_item_equipamento_os_update
    AFTER UPDATE ON item_equipamento_os
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('item_equipamento_os', CONCAT(NEW.os_id, ':', NEW.equipamento_id), 'atualizado', JSON_OBJECT('os_id', NEW.os_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_item_equipamento_os_delete
    AFTER DELETE ON item_equipamento_os
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('item_equipamento_os', CONCAT(OLD.os_id, ':', OLD.equipamento_id), 'deletado', JSON_OBJECT('os_id', OLD.os_id, 'equipamento_id', OLD.equipamento_id, 'quantidade', OLD.quantidade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_item_equipamento_projeto_insert
    AFTER INSERT ON item_equipamento_projeto
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('item_equipamento_projeto', CONCAT(NEW.projeto_id, ':', NEW.equipamento_id), 'criado', JSON_OBJECT('projeto_id', NEW.projeto_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_item_equipamento_projeto_update
    AFTER UPDATE ON item_equipamento_projeto
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('item_equipamento_projeto', CONCAT(NEW.projeto_id, ':', NEW.equipamento_id), 'atualizado', JSON_OBJECT('projeto_id', NEW.projeto_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_item_equipamento_projeto_delete
    AFTER DELETE ON item_equipamento_projeto
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('item_equipamento_projeto', CONCAT(OLD.projeto_id, ':', OLD.equipamento_id), 'deletado', JSON_OBJECT('projeto_id', OLD.projeto_id, 'equipamento_id', OLD.equipamento_id, 'quantidade', OLD.quantidade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_item_equipamento_manutencao_insert
    AFTER INSERT ON item_equipamento_manutencao
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('item_equipamento_manutencao', CONCAT(NEW.manutencao_id, ':', NEW.equipamento_id), 'criado', JSON_OBJECT('manutencao_id', NEW.manutencao_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_item_equipamento_manutencao_update
    AFTER UPDATE ON item_equipamento_manutencao
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('item_equipamento_manutencao', CONCAT(NEW.manutencao_id, ':', NEW.equipamento_id), 'atualizado', JSON_OBJECT('manutencao_id', NEW.manutencao_id, 'equipamento_id', NEW.equipamento_id, 'quantidade', NEW.quantidade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_item_equipamento_manutencao_delete
    AFTER DELETE ON item_equipamento_manutencao
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('item_equipamento_manutencao', CONCAT(OLD.manutencao_id, ':', OLD.equipamento_id), 'deletado', JSON_OBJECT('manutencao_id', OLD.manutencao_id, 'equipamento_id', OLD.equipamento_id, 'quantidade', OLD.quantidade), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_notificacoes_insert
    AFTER INSERT ON notificacoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('notificacoes', CAST(NEW.notificacao_id AS CHAR), 'criado', JSON_OBJECT('notificacao_id', NEW.notificacao_id, 'titulo', NEW.titulo, 'mensagem', NEW.mensagem, 'time_id', NEW.time_id, 'os_id', NEW.os_id, 'usuario_origem_id', NEW.usuario_origem_id, 'data_criacao', NEW.data_criacao), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_notificacoes_update
    AFTER UPDATE ON notificacoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('notificacoes', CAST(NEW.notificacao_id AS CHAR), 'atualizado', JSON_OBJECT('notificacao_id', NEW.notificacao_id, 'titulo', NEW.titulo, 'mensagem', NEW.mensagem, 'time_id', NEW.time_id, 'os_id', NEW.os_id, 'usuario_origem_id', NEW.usuario_origem_id, 'data_criacao', NEW.data_criacao), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_notificacoes_delete
    AFTER DELETE ON notificacoes
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('notificacoes', CAST(OLD.notificacao_id AS CHAR), 'deletado', JSON_OBJECT('notificacao_id', OLD.notificacao_id, 'titulo', OLD.titulo, 'mensagem', OLD.mensagem, 'time_id', OLD.time_id, 'os_id', OLD.os_id, 'usuario_origem_id', OLD.usuario_origem_id, 'data_criacao', OLD.data_criacao), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_notificacao_leituras_insert
    AFTER INSERT ON notificacao_leituras
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('notificacao_leituras', CONCAT(NEW.notificacao_id, ':', NEW.usuario_id), 'criado', JSON_OBJECT('notificacao_id', NEW.notificacao_id, 'usuario_id', NEW.usuario_id, 'data_leitura', NEW.data_leitura), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_notificacao_leituras_update
    AFTER UPDATE ON notificacao_leituras
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('notificacao_leituras', CONCAT(NEW.notificacao_id, ':', NEW.usuario_id), 'atualizado', JSON_OBJECT('notificacao_id', NEW.notificacao_id, 'usuario_id', NEW.usuario_id, 'data_leitura', NEW.data_leitura), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_hist_notificacao_leituras_delete
    AFTER DELETE ON notificacao_leituras
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('notificacao_leituras', CONCAT(OLD.notificacao_id, ':', OLD.usuario_id), 'deletado', JSON_OBJECT('notificacao_id', OLD.notificacao_id, 'usuario_id', OLD.usuario_id, 'data_leitura', OLD.data_leitura), @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_audit_os_insert AFTER INSERT ON os FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('os', CAST(NEW.os_id AS CHAR), 'criado', JSON_OBJECT('os_id', NEW.os_id, 'os_titulo', NEW.os_titulo, 'os_status', NEW.os_status, 'prioridade', NEW.prioridade, 'data_limite', NEW.data_limite, 'id_criador', NEW.id_criador, 'id_time_responsavel', NEW.id_time_responsavel, 'projeto_id', NEW.projeto_id, 'manutencao_id', NEW.manutencao_id), @app_actor_id, @app_actor_email);
END //
CREATE TRIGGER trg_audit_os_update AFTER UPDATE ON os FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('os', CAST(NEW.os_id AS CHAR), 'atualizado', JSON_OBJECT('os_id', NEW.os_id, 'os_titulo', NEW.os_titulo, 'os_status', NEW.os_status, 'prioridade', NEW.prioridade, 'data_limite', NEW.data_limite, 'id_criador', NEW.id_criador, 'id_time_responsavel', NEW.id_time_responsavel, 'projeto_id', NEW.projeto_id, 'manutencao_id', NEW.manutencao_id), @app_actor_id, @app_actor_email);
END //
CREATE TRIGGER trg_audit_os_delete AFTER DELETE ON os FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('os', CAST(OLD.os_id AS CHAR), 'deletado', JSON_OBJECT('os_id', OLD.os_id, 'os_titulo', OLD.os_titulo, 'os_status', OLD.os_status, 'prioridade', OLD.prioridade, 'data_limite', OLD.data_limite, 'id_criador', OLD.id_criador, 'id_time_responsavel', OLD.id_time_responsavel, 'projeto_id', OLD.projeto_id, 'manutencao_id', OLD.manutencao_id), @app_actor_id, @app_actor_email);
END //
CREATE TRIGGER trg_audit_equipamentos_insert AFTER INSERT ON equipamentos FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('equipamentos', CAST(NEW.equipamento_id AS CHAR), 'criado', JSON_OBJECT('equipamento_id', NEW.equipamento_id, 'nome_equipamento', NEW.nome_equipamento), @app_actor_id, @app_actor_email);
END //
CREATE TRIGGER trg_audit_equipamentos_update AFTER UPDATE ON equipamentos FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('equipamentos', CAST(NEW.equipamento_id AS CHAR), 'atualizado', JSON_OBJECT('equipamento_id', NEW.equipamento_id, 'nome_equipamento', NEW.nome_equipamento), @app_actor_id, @app_actor_email);
END //
CREATE TRIGGER trg_audit_equipamentos_delete AFTER DELETE ON equipamentos FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('equipamentos', CAST(OLD.equipamento_id AS CHAR), 'deletado', JSON_OBJECT('equipamento_id', OLD.equipamento_id, 'nome_equipamento', OLD.nome_equipamento), @app_actor_id, @app_actor_email);
END //
CREATE TRIGGER trg_audit_anexo_insert AFTER INSERT ON anexo FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('anexo', CAST(NEW.anexo_id AS CHAR), 'criado', JSON_OBJECT('anexo_id', NEW.anexo_id, 'os_id', NEW.os_id, 'manutencao_id', NEW.manutencao_id, 'projeto_id', NEW.projeto_id, 'nome_anexo', NEW.nome_anexo, 'anexo_tipo', NEW.anexo_tipo, 'data_anexo', NEW.data_anexo), @app_actor_id, @app_actor_email);
END //
CREATE TRIGGER trg_audit_anexo_update AFTER UPDATE ON anexo FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('anexo', CAST(NEW.anexo_id AS CHAR), 'atualizado', JSON_OBJECT('anexo_id', NEW.anexo_id, 'os_id', NEW.os_id, 'manutencao_id', NEW.manutencao_id, 'projeto_id', NEW.projeto_id, 'nome_anexo', NEW.nome_anexo, 'anexo_tipo', NEW.anexo_tipo, 'data_anexo', NEW.data_anexo), @app_actor_id, @app_actor_email);
END //
CREATE TRIGGER trg_audit_anexo_delete AFTER DELETE ON anexo FOR EACH ROW BEGIN
  INSERT INTO historico_registros (tabela, registro_id, tipo_acao, dados, usuario_id, usuario_email) VALUES ('anexo', CAST(OLD.anexo_id AS CHAR), 'deletado', JSON_OBJECT('anexo_id', OLD.anexo_id, 'os_id', OLD.os_id, 'manutencao_id', OLD.manutencao_id, 'projeto_id', OLD.projeto_id, 'nome_anexo', OLD.nome_anexo, 'anexo_tipo', OLD.anexo_tipo, 'data_anexo', OLD.data_anexo), @app_actor_id, @app_actor_email);
END //
CREATE TRIGGER trg_insert_os 
    AFTER INSERT ON os
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_os(os_id, id_time_responsavel, os_titulo, os_status, data_limite, tipo_acao, usuario_id, usuario_email)
        VALUES (NEW.os_id, NEW.id_time_responsavel, NEW.os_titulo, NEW.os_status, NEW.data_limite, 'criado', @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_update_os 
    AFTER UPDATE ON os
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_os(os_id, id_time_responsavel, os_titulo, os_status, data_limite, tipo_acao, usuario_id, usuario_email)
        VALUES (NEW.os_id, NEW.id_time_responsavel, NEW.os_titulo, NEW.os_status, NEW.data_limite, 'atualizado', @app_actor_id, @app_actor_email);
    END //
CREATE TRIGGER trg_delete_os 
    AFTER DELETE ON os
    FOR EACH ROW
    BEGIN
        INSERT INTO historico_os(os_id, id_time_responsavel, os_titulo, os_status, data_limite, tipo_acao, usuario_id, usuario_email)
        VALUES (OLD.os_id, OLD.id_time_responsavel, OLD.os_titulo, OLD.os_status, OLD.data_limite, 'deletado', @app_actor_id, @app_actor_email);
    END //

DELIMITER ;
