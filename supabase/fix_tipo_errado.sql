-- Passo 1 de 2: apaga as tabelas antigas que foram criadas com o tipo errado
-- (user_id como bigint em vez de uuid). Seguro rodar — essas tabelas nunca
-- sincronizaram de verdade, então não existe dado real perdido aqui.
drop table if exists public.tasks cascade;
drop table if exists public.user_stats cascade;
