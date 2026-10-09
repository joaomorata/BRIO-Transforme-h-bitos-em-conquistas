# BRIO

Plataforma de produtividade gamificada para organizar tarefas, estudar, acompanhar XP e usar o Pomodoro.

## Como executar

No terminal, dentro desta pasta:

```bash
npm install
npm run dev
```

Depois abra o endereço mostrado pelo Vite, normalmente `http://localhost:3000`.

## Arquitetura

- **Autenticação**: Supabase Auth (`supabase.auth`), com sessão persistida e cadastro sem confirmação de e-mail.
- **Dados de progresso** (tarefas, XP, streak, pomodoros): hoje ficam em `localStorage`, por conta e por dispositivo. Migração para tabelas no Postgres do Supabase é o próximo passo planejado, para permitir sincronização entre dispositivos.
- **Quiz da página Estudar**: usa um banco local de perguntas em português (`src/data/studyQuestions.ts`) e não depende de internet.

Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no `.env` antes de rodar o projeto.