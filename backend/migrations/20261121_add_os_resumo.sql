-- US24: resumo das atividades da O.S., registrado pelo líder do time.
-- (Em banco novo, o script.sql já cria a coluna. O backend também a cria sozinho ao iniciar,
--  então esta migration só é necessária se você preferir aplicar o ajuste manualmente.)

ALTER TABLE os
    ADD COLUMN os_resumo VARCHAR(500) NULL AFTER os_descricao;
