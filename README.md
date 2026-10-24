# Eldoria

RPG narrativo medieval de fantasia com Mestre IA. Desenvolvimento **solo-first**, com arquitetura preparada para multiplayer futuro.

## Stack
- `apps/web`: Next.js, TypeScript, Tailwind CSS (Vercel)
- `apps/api`: FastAPI, Python, Pydantic (Render)
- `supabase/migrations`: PostgreSQL e Supabase Auth

## Princípios
- Premissa e cânone oficiais, sem criação de campanha personalizada pelo jogador.
- Prólogos personalizados por origem e antecedentes.
- Motor de regras D20 autoritativo no backend, independente do modelo de IA.
- Eventos e consequências persistentes, isolados por campanha.
- Multiplayer **fora do escopo do MVP solo**.

## Desenvolvimento
A fundação inicial inclui API com `/health`, frontend inicial e esquema de dados versionado. Configurar variáveis usando `.env.example`, nunca versionar credenciais. Os serviços de deploy serão configurados depois da validação do código.
