-- Marca uma conta já existente como administradora do BRIO.
-- Troque o e-mail abaixo pelo e-mail da conta que você já cadastrou
-- (a mesma que você criou pelo "Criar conta" comum do BRIO).

update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
where email = 'TROQUE_PELO_SEU_EMAIL_AQUI';

-- Pra conferir se funcionou, rode esta consulta depois:
select email, raw_user_meta_data
from auth.users
where email = 'TROQUE_PELO_SEU_EMAIL_AQUI';
