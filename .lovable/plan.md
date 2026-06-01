# LyneKoto — Reformulação Completa do Console

## Objetivo

Transformar o painel em uma experiência de **dashboard SaaS profissional**, sem conteúdo centralizado, com suporte sólido ao modo claro (contornos, hover, foco visíveis) e um **Studio em formato Canvas** para construção de quizzes/atividades por blocos — fluxo "Novo projeto → modal → card → canvas editor".

---

## 1. Layout global (resolver o "tudo centralizado")

Problema atual: cada rota usa `container max-w-7xl mx-auto`, criando uma faixa centralizada com vazio enorme à direita.

Mudanças:
- `_authenticated.tsx`: header sticky redesenhado com breadcrumb dinâmico, busca global, botão de tema (claro/escuro) e avatar com menu.
- Conteúdo das rotas passa a usar **largura total** com padding lateral consistente (`px-6 lg:px-10 py-8`), sem `container` nem `max-w-7xl`.
- Grid principal grudado à sidebar — sem "ilha" central.
- Sidebar: ativa light-mode (hoje é dark fixo). Tokens próprios `--sidebar` no `.light` e `.dark` para integrar com o tema.

## 2. Modo claro real (contornos, foco, hover)

- Reforçar `--border` e adicionar `--border-strong` para divisões importantes.
- `Input`, `Button outline`, `Card`: borda visível (1px sólido sobre `--border-strong`), `ring-2` no foco com offset.
- Hovers em cards: `hover:border-primary/40 hover:shadow-soft` (não só shadow).
- Sidebar light: fundo `--sidebar` claro (off-white), item ativo com pílula `bg-primary/10 text-primary border-l-2 border-primary`.
- Toggle de tema no header (persistido em `localStorage`), com `prefers-color-scheme` como padrão inicial.

## 3. Sidebar profissional

Reorganizada em 3 seções claras:
- **Workspace**: Dashboard, Studio, Biblioteca
- **Sala de aula**: Turmas, Alunos, QR Scan, Apresentar
- **Insights**: Analytics, Conquistas
- Rodapé: avatar + nome + e-mail, com menu (Configurações, Sair).

## 4. Dashboard (`/dashboard`)

Layout em 12 colunas full-width:
- Topo: saudação curta + ações rápidas (Novo projeto, Importar).
- Linha de KPIs (4 cards limpos: Projetos, Turmas, Alunos, Sessões) — sem ícones gigantes desproporcionais.
- Coluna 8: **Projetos recentes** (lista densa em tabela com hover, status, última edição).
- Coluna 4: **Atalhos** (criar projeto, criar turma, ajuda) + **Atividade da IA** (últimas gerações).

## 5. Studio — Canvas profissional (núcleo do produto)

### 5.1 Lista de projetos (`/studio`)
- Header: "Studio" + busca + filtros (tipo, matéria) + botão `+ Novo projeto`.
- Grid de **cards de projeto** (capa colorida derivada da matéria, título, contagem de blocos, badge de status: Rascunho/Pronto/Aplicado, menu de ações: Renomear, Duplicar, Excluir, Apresentar).
- Estado vazio com CTA grande.

### 5.2 Modal "Novo projeto"
Acionado pelo botão `+ Novo projeto` e atalho `N`:
- Campos: **Nome do projeto** (obrigatório), Matéria, Série, Tipo (Quiz, Revisão, Simulado, Desafio).
- Botões: **Cancelar** | **Criar projeto** (cria registro em `activities` com `questions = []` e status `draft`, navega para `/studio/:id`).

### 5.3 Canvas Editor (`/studio/$id`)
Layout de 3 colunas, full-screen (header próprio, sem header global):
- **Coluna esquerda (240px) — Blocos**: paleta arrastável/clicável com tipos de bloco:
  - Múltipla Escolha
  - Verdadeiro/Falso
  - Resposta Curta
  - Ordenação
  - Caixa de Texto / Instrução
  - Mídia (imagem/embed)
  - Separador de seção
- **Centro — Canvas**: lista vertical de blocos arrastáveis (drag handle), com renderização real de cada bloco (preview editável inline). Botão "+" entre blocos para inserir. Toolbar superior do canvas com: nome do projeto editável, autosave indicator, undo/redo, Apresentar, Compartilhar.
- **Coluna direita (320px) — Inspector**: propriedades do bloco selecionado (texto, alternativas, marcador de correta, dificuldade, tempo, pontos, explicação) + abas "Bloco / Projeto / IA".
  - Aba **IA**: caixa "Gerar com IA" (tema + nº de questões) que adiciona blocos prontos ao canvas sem sair da tela.

Persistência: cada alteração faz debounce de 800ms e grava `questions` (JSONB) + `updated_at` via `supabase.from("activities").update(...)`. Indicador "Salvo" / "Salvando...".

Atalhos: `Cmd/Ctrl+S` (salvar), `Cmd/Ctrl+Z` (undo), `Delete` (remover bloco), `Cmd/Ctrl+D` (duplicar), `N` (novo bloco).

### 5.4 Banco de dados
Migration leve em `activities`:
- Adicionar `status TEXT DEFAULT 'draft'` (`draft | ready | applied`)
- Adicionar `cover_color TEXT` (cor do card no studio)
- Adicionar `description TEXT`
- Manter `questions JSONB` como fonte única dos blocos (formato estendido com `type`, `id`, `data`, `points`, `time_limit`).

## 6. Biblioteca (`/library`)

Vira "Atividades publicadas" — só lista projetos com `status != 'draft'`. Mesmo grid do Studio, mas read-only com botão grande **Apresentar**.

## 7. Turmas / Alunos

- **Turmas (`/classes`)**: tabela densa com nome, série, disciplina, nº de alunos, última sessão, ações. Painel lateral abre detalhes da turma + lista de alunos.
- **Alunos (`/students`)**: tabela global com filtro por turma, importar CSV, gerar QR Cards em lote (PDF), busca, paginação.

## 8. Analytics / Conquistas / Configurações

- **Analytics**: layout em grade com gráficos (recharts) — desempenho por turma, evolução semanal, tópicos com baixa retenção, alunos em risco. Sem mock — consultas reais agregando `responses`.
- **Conquistas**: catálogo de medalhas + ranking (placeholder funcional ligado a `students.xp`).
- **Configurações**: abas Perfil, Escola, Aparência (tema), Integrações, Cobrança.

## 9. QR Scan / Apresentar

Mantidos como rotas existentes, só ajuste visual ao novo padrão (sem `container max-w-7xl`).

---

## Sequência de implementação

1. Tokens + sidebar com suporte claro/escuro + toggle no header.
2. `_authenticated.tsx` novo (header rico, sem container).
3. Dashboard reformulado (full-width, layout 12 col).
4. Migration: status + cover_color + description em `activities`.
5. Studio — lista de projetos + modal "Novo projeto".
6. Studio — Canvas Editor `/studio/$id` (paleta + canvas + inspector + autosave).
7. Biblioteca reformulada (lê do mesmo `activities`).
8. Turmas / Alunos reformulados.
9. Analytics / Conquistas / Configurações reformulados.
10. QR Scan / Apresentar — ajustes visuais.

## Detalhes técnicos

- Drag & drop dos blocos: `@dnd-kit/core` + `@dnd-kit/sortable` (a instalar).
- Tema: contexto leve (`ThemeProvider`) + classe `light/dark` no `<html>` via `useEffect`.
- Autosave: hook `useAutosave(value, save, 800)`.
- Schema de bloco no `questions`:
  ```ts
  { id: string, type: 'mcq'|'tf'|'short'|'order'|'text'|'media'|'divider',
    data: any, points?: number, time_limit?: number }
  ```
- Sem mock, sem placeholder — tudo conectado ao Supabase real.

## Fora de escopo desta rodada (ficam para depois)

- QR Scan com visão computacional avançada
- Gamificação completa (missões, XP automático)
- Multi-tenant avançado (escolas múltiplas)
- Admin Center
