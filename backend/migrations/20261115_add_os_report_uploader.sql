ALTER TABLE anexo
    ADD COLUMN id_usuario_envio INT NULL AFTER data_anexo,
    ADD INDEX idx_anexo_usuario_envio (id_usuario_envio),
    ADD CONSTRAINT fk_anexo_usuario_envio
        FOREIGN KEY (id_usuario_envio) REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL;