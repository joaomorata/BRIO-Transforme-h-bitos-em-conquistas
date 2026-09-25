-- BRIO — migração das tabelas de progresso (tarefas, XP, streak, pomodoros)
-- Rode este script em: Supabase Dashboard → SQL Editor → New query → Run

-- 1. Tabela de estatísticas do usuário (um registro por usuário)
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  tasks_completed integer not null default 0,
  pomodoros_completed integer not null default 0,
  total_focus_minutes integer not null default 0,
  last_active_date date not null default current_date,
  weekly_xp_log jsonb not null default '[]'::jsonb,
  display_name text,
  avatar_color text,
  updated_at timestamptz not null default now()
);

-- Se a tabela já existia de uma migração anterior, garante as colunas novas do ranking:
alter table public.user_stats add column if not exists display_name text;
alter table public.user_stats add column if not exists avatar_color text;

-- 2. Tabela de tarefas
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('study', 'work', 'health', 'personal')),
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  xp_reward integer not null default 0,
  pomodoros_target integer not null default 1,
  due_date date,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);

-- 3. Segurança: cada usuário só acessa os próprios dados (RLS)
alter table public.user_stats enable row level security;
alter table public.tasks enable row level security;

-- Leitura ampliada: qualquer usuário logado pode ver o XP/nível de todos, para
-- o ranking funcionar. A tabela guarda só dados de jogo (XP, nível, streak,
-- nome de exibição) — nada sensível como e-mail, tarefas ou humor.
drop policy if exists "user_stats_select_own" on public.user_stats;
drop policy if exists "user_stats_select_all" on public.user_stats;
create policy "user_stats_select_all" on public.user_stats
  for select using (auth.uid() is not null);

drop policy if exists "user_stats_insert_own" on public.user_stats;
create policy "user_stats_insert_own" on public.user_stats
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_stats_update_own" on public.user_stats;
create policy "user_stats_update_own" on public.user_stats
  for update using (auth.uid() = user_id);

drop policy if exists "user_stats_delete_own" on public.user_stats;
create policy "user_stats_delete_own" on public.user_stats
  for delete using (auth.uid() = user_id);

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

-- 4. Tabela de check-ins de energia/humor (antes e depois das sessões de foco)
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  energy smallint not null check (energy between 1 and 5),
  context text not null check (context in ('pre_focus', 'post_focus')),
  occurred_at timestamptz not null default now()
);

create index if not exists mood_entries_user_id_idx on public.mood_entries(user_id);

alter table public.mood_entries enable row level security;

drop policy if exists "mood_entries_select_own" on public.mood_entries;
create policy "mood_entries_select_own" on public.mood_entries
  for select using (auth.uid() = user_id);

drop policy if exists "mood_entries_insert_own" on public.mood_entries;
create policy "mood_entries_insert_own" on public.mood_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "mood_entries_update_own" on public.mood_entries;
create policy "mood_entries_update_own" on public.mood_entries
  for update using (auth.uid() = user_id);

drop policy if exists "mood_entries_delete_own" on public.mood_entries;
create policy "mood_entries_delete_own" on public.mood_entries
  for delete using (auth.uid() = user_id);

-- 5. Histórico de resultados de quiz (para calcular taxa de acerto por matéria)
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id integer not null,
  subject_label text not null,
  correct integer not null,
  total integer not null,
  difficulty text not null,
  finished_at timestamptz not null default now()
);

create index if not exists quiz_results_user_id_idx on public.quiz_results(user_id);

alter table public.quiz_results enable row level security;

drop policy if exists "quiz_results_select_own" on public.quiz_results;
create policy "quiz_results_select_own" on public.quiz_results
  for select using (auth.uid() = user_id);

drop policy if exists "quiz_results_insert_own" on public.quiz_results;
create policy "quiz_results_insert_own" on public.quiz_results
  for insert with check (auth.uid() = user_id);

drop policy if exists "quiz_results_update_own" on public.quiz_results;
create policy "quiz_results_update_own" on public.quiz_results
  for update using (auth.uid() = user_id);

drop policy if exists "quiz_results_delete_own" on public.quiz_results;
create policy "quiz_results_delete_own" on public.quiz_results
  for delete using (auth.uid() = user_id);

-- 6. Planos de prova (Modo Prova)
create table if not exists public.exam_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id integer not null,
  subject_label text not null,
  exam_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists exam_plans_user_id_idx on public.exam_plans(user_id);

alter table public.exam_plans enable row level security;

drop policy if exists "exam_plans_select_own" on public.exam_plans;
create policy "exam_plans_select_own" on public.exam_plans
  for select using (auth.uid() = user_id);

drop policy if exists "exam_plans_insert_own" on public.exam_plans;
create policy "exam_plans_insert_own" on public.exam_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "exam_plans_update_own" on public.exam_plans;
create policy "exam_plans_update_own" on public.exam_plans
  for update using (auth.uid() = user_id);

drop policy if exists "exam_plans_delete_own" on public.exam_plans;
create policy "exam_plans_delete_own" on public.exam_plans
  for delete using (auth.uid() = user_id);

-- 7. Lista de administradores — SUBSTITUI o "role" nos metadados do usuário
-- como fonte de verdade. Metadados de usuário (raw_user_meta_data) podem ser
-- alterados pelo PRÓPRIO usuário logado via supabase.auth.updateUser(), então
-- qualquer pessoa podia se autopromover a admin abrindo o console do
-- navegador. Esta tabela não tem NENHUMA política de insert/update/delete —
-- ou seja, ninguém com a chave publicável consegue escrever nela. O único
-- jeito de adicionar um admin é rodando um INSERT manualmente no SQL Editor
-- (você, como dono do projeto).
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admins_select_self" on public.admins;
create policy "admins_select_self" on public.admins
  for select using (auth.uid() = user_id);

-- 8. Validações de sanidade nos valores de jogo. RLS garante QUEM pode
-- escrever (o dono da linha); isso aqui limita O QUÊ pode ser escrito —
-- sem isso, qualquer usuário logado poderia abrir o console do navegador e
-- gravar total_xp: 999999 direto no Supabase, sem passar pela lógica do app.
-- Não impede 100% a trapaça (ainda dá pra escrever um valor "razoável" mas
-- falso), mas barra os casos óbvios e serve de defesa em camadas.
alter table public.user_stats drop constraint if exists user_stats_total_xp_check;
alter table public.user_stats add constraint user_stats_total_xp_check check (total_xp >= 0);
alter table public.user_stats drop constraint if exists user_stats_level_check;
alter table public.user_stats add constraint user_stats_level_check check (level >= 1);
alter table public.user_stats drop constraint if exists user_stats_streak_check;
alter table public.user_stats add constraint user_stats_streak_check check (current_streak >= 0 and best_streak >= 0);
alter table public.user_stats drop constraint if exists user_stats_counts_check;
alter table public.user_stats add constraint user_stats_counts_check
  check (tasks_completed >= 0 and pomodoros_completed >= 0 and total_focus_minutes >= 0);

alter table public.tasks drop constraint if exists tasks_xp_reward_check;
alter table public.tasks add constraint tasks_xp_reward_check check (xp_reward >= 0 and xp_reward <= 500);

alter table public.quiz_results drop constraint if exists quiz_results_score_check;
alter table public.quiz_results add constraint quiz_results_score_check
  check (correct >= 0 and total >= 0 and correct <= total);
