-- Add project team ownership and project notification links without dropping data.
SET @schema_name = DATABASE();

SET @ddl = IF(
  (SELECT DATA_TYPE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND COLUMN_NAME = 'mensagem') = 'varchar',
  'ALTER TABLE notificacoes MODIFY COLUMN mensagem TEXT NOT NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND COLUMN_NAME = 'usuario_destino_id') = 0,
  'ALTER TABLE notificacoes ADD COLUMN usuario_destino_id INT NULL AFTER usuario_origem_id',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND COLUMN_NAME = 'data_criacao') = 0,
  'ALTER TABLE notificacoes ADD COLUMN data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER usuario_destino_id',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND COLUMN_NAME = 'projeto_id') = 0,
  'ALTER TABLE notificacoes ADD COLUMN projeto_id INT NULL AFTER os_id',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND INDEX_NAME = 'idx_notificacoes_projeto') = 0,
  'ALTER TABLE notificacoes ADD INDEX idx_notificacoes_projeto (projeto_id)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND INDEX_NAME = 'uq_notificacoes_projeto_destino') = 0,
  'ALTER TABLE notificacoes ADD UNIQUE INDEX uq_notificacoes_projeto_destino (projeto_id, usuario_destino_id)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = @schema_name AND TABLE_NAME = 'notificacoes' AND CONSTRAINT_NAME = 'fk_notificacoes_projeto') = 0,
  'ALTER TABLE notificacoes ADD CONSTRAINT fk_notificacoes_projeto FOREIGN KEY (projeto_id) REFERENCES projetos(projeto_id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
