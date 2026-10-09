-- Diagnóstico: mostra o tipo de cada coluna "id" ou "user_id" nas tabelas do BRIO.
-- O esperado é "uuid" em todas. Se alguma aparecer como "bigint" ou "integer",
-- essa é a tabela com o schema antigo/errado.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('tasks', 'user_stats', 'mood_entries', 'quiz_results', 'exam_plans')
  and column_name in ('id', 'user_id')
order by table_name, column_name;
