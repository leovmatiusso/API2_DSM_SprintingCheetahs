SET @add_os_block_reason = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'os'
        AND COLUMN_NAME = 'motivo_bloqueio') = 0,
    'ALTER TABLE os ADD COLUMN motivo_bloqueio TEXT NULL AFTER id_time_responsavel',
    'SELECT 1'
);
PREPARE add_os_block_reason_stmt FROM @add_os_block_reason;
EXECUTE add_os_block_reason_stmt;
DEALLOCATE PREPARE add_os_block_reason_stmt;
