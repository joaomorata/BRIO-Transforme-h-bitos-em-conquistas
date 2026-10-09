-- Marca a conta admin@brio.app como administradora do BRIO.
--
-- Isso insere na tabela `admins`, que ninguém além de você (dono do projeto,
-- via SQL Editor) consegue escrever. É essa tabela — não os metadados do
-- usuário — que decide quem é admin.

insert into public.admins (user_id)
select id from auth.users where email = 'admin@brio.app'
on conflict (user_id) do nothing;

-- Pra conferir se funcionou:
select u.email, a.created_at as admin_desde
from public.admins a
join auth.users u on u.id = a.user_id;

-- Pra REMOVER um admin, rode:
-- delete from public.admins where user_id = (select id from auth.users where email = 'EMAIL_AQUI');
