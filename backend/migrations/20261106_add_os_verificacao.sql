-- Adiciona a etapa de verificação da O.S. pela equipe de monitoramento em bancos já existentes.
-- (Em banco novo, o script.sql já cria tudo isso.)

ALTER TABLE os
    MODIFY COLUMN os_status ENUM(
        'aberta',
        'em andamento',
        'concluida',
        'teste',
        'bloqueado',
        'review',
        'verificacao'
    ) NOT NULL DEFAULT 'aberta';

CREATE TABLE IF NOT EXISTS os_verificacoes (
    verificacao_id INT PRIMARY KEY AUTO_INCREMENT,
    os_id INT NOT NULL,
    resultado ENUM('aprovada', 'reprovada') NOT NULL,
    justificativa TEXT NULL,
    usuario_id INT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_os_verificacoes_os (os_id, data_criacao),
    CONSTRAINT fk_verificacao_os
        FOREIGN KEY (os_id) REFERENCES os(os_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_verificacao_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;
