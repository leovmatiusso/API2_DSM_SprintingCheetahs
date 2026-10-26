-- Add maintenance notification links without changing maintenance ownership.
SET @schema_name = DATABASE();

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
