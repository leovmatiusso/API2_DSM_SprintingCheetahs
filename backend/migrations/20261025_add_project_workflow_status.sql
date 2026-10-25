SET @add_project_status = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'projetos'
        AND COLUMN_NAME = 'status') = 0,
    'ALTER TABLE projetos ADD COLUMN status ENUM(''aberto'', ''em_andamento'', ''finalizado'') NOT NULL DEFAULT ''aberto'' AFTER projeto_id',
    'SELECT 1'
);
PREPARE add_project_status_stmt FROM @add_project_status;
EXECUTE add_project_status_stmt;
DEALLOCATE PREPARE add_project_status_stmt;

UPDATE projetos p
   SET status = 'em_andamento'
 WHERE status = 'aberto'
   AND EXISTS (
     SELECT 1 FROM os o
      WHERE o.projeto_id = p.projeto_id
        AND o.os_status = 'em andamento'
   );
