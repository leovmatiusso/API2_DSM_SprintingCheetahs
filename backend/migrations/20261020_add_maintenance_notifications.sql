-- Add maintenance team ownership and notification links without dropping data.
SET @schema_name = DATABASE();

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'manutencoes' AND COLUMN_NAME = 'id_time_responsavel') = 0,
  'ALTER TABLE manutencoes ADD COLUMN id_time_responsavel INT NULL AFTER responsavel_id',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'manutencoes' AND INDEX_NAME = 'idx_manutencao_time_responsavel') = 0,
  'ALTER TABLE manutencoes ADD INDEX idx_manutencao_time_responsavel (id_time_responsavel)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = @schema_name AND TABLE_NAME = 'manutencoes' AND CONSTRAINT_NAME = 'fk_manutencao_time_responsavel') = 0,
  'ALTER TABLE manutencoes ADD CONSTRAINT fk_manutencao_time_responsavel FOREIGN KEY (id_time_responsavel) REFERENCES `time`(id_time) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND COLUMN_NAME = 'manutencao_id') = 0,
  'ALTER TABLE notificacoes ADD COLUMN manutencao_id INT NULL AFTER os_id',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND INDEX_NAME = 'idx_notificacoes_manutencao') = 0,
  'ALTER TABLE notificacoes ADD INDEX idx_notificacoes_manutencao (manutencao_id)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND CONSTRAINT_NAME = 'fk_notificacoes_manutencao') = 0,
  'ALTER TABLE notificacoes ADD CONSTRAINT fk_notificacoes_manutencao FOREIGN KEY (manutencao_id) REFERENCES manutencoes(manutencao_id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;