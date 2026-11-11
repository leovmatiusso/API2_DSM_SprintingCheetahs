-- Equipamentos e materiais passam a existir somente nas O.S. (item_equipamento_os).
-- Remove as tabelas de equipamentos de projetos e manutenções em bancos já existentes.
-- ATENÇÃO: apaga os equipamentos que estavam ligados a projetos e manutenções.
-- (Em banco novo, o script.sql já não cria essas tabelas.)

DROP TABLE IF EXISTS item_equipamento_projeto;
DROP TABLE IF EXISTS item_equipamento_manutencao;
