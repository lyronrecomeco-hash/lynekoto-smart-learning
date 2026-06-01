
# Plano de correção — LyneKoto v2

Foco: destravar o fluxo de criação de projeto → canvas → apresentação, eliminar bugs de SSR/navegação, deixar a sidebar com cara de dashboard profissional (escura) e implementar QR Card de 4 orientações.

---

## 1. Studio → Canvas: fluxo de criação destravado

**Problema:** depois de criar o projeto no modal, o `navigate({ to: "/studio/$id" })` às vezes não entra na tela do canvas (loader trava ou crasha).

**Correções:**
- Em `src/routes/_authenticated/studio.tsx`: após o insert, **invalidar a query** `["studio-project", id]` antes de navegar, e usar `navigate({ to: "/studio/$id", params: { id: data.id }, replace: false })`.
- Em `src/routes/_authenticated/studio.$id.tsx`:
  - Adicionar `notFoundComponent` e `errorComponent` na rota (hoje só tem `component`, e qualquer erro vira "SSR rendering failed" em branco).
  - Trocar `crypto.randomUUID()` no fallback de hidratação para uma função util `genId()` que verifica `typeof crypto` (causa de SSR mismatch).
  - Garantir `useQuery` com `enabled: typeof window !== "undefined"` e fallback de loading não-vazio (evita hydration mismatch).
- Em `_authenticated.tsx`: remover a regra `isFullBleed` que esconde a sidebar em `/studio/$id`. O canvas passa a renderizar **dentro** do layout autenticado (com sidebar + header), igual às outras telas. O próprio canvas mantém seu toolbar interno com botão **← Voltar para projetos**.

---

## 2. Botão de voltar + menu visível no canvas

- Sidebar fica visível no `/studio/$id`.
- Toolbar interna do canvas (linha 182) ganha: `← Voltar` (já existe, mantido), breadcrumb `Studio / {nome}`, botão **Apresentar** e selector de status.
- Modo "foco" opcional via botão (esconde sidebar) — não é o padrão.

---

## 3. Sidebar profissional escura (mesmo no light mode)

A sidebar deve ter visual escuro em qualquer tema, igual Linear/Vercel.

Em `src/styles.css`, no `:root` (light):
```
--sidebar: oklch(0.18 0.025 268);            /* slate quase preto */
--sidebar-foreground: oklch(0.92 0.01 260);
--sidebar-accent: oklch(0.26 0.05 270);
--sidebar-accent-foreground: oklch(0.98 0 0);
--sidebar-border: oklch(0.24 0.02 268);
--sidebar-primary: oklch(0.7 0.18 275);
```
- Ajustar `app-sidebar.tsx`: gradiente do logo passa a usar `bg-sidebar-primary`, ativos com `bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary`.
- Header principal continua claro (contraste preto/branco clássico de dashboard).

---

## 4. Cores dos cards de projeto — fim do "neon"

Em `studio.tsx`, substituir `COVERS` por paleta sóbria (indigo profundo, azul-aço, verde-musgo, terracota suave, grafite, ardósia):
```
"linear-gradient(135deg, oklch(0.32 0.08 268), oklch(0.42 0.1 280))"
"linear-gradient(135deg, oklch(0.30 0.05 230), oklch(0.40 0.08 245))"
"linear-gradient(135deg, oklch(0.35 0.07 165), oklch(0.45 0.08 180))"
"linear-gradient(135deg, oklch(0.38 0.09 40), oklch(0.45 0.10 55))"
"linear-gradient(135deg, oklch(0.22 0.02 260), oklch(0.30 0.03 270))"
"linear-gradient(135deg, oklch(0.32 0.06 320), oklch(0.40 0.07 340))"
```
Sem saturação alta, sem efeitos brilhantes. Migration leve para resetar `cover_color` de projetos existentes (`UPDATE activities SET cover_color = NULL`) para que peguem o novo random.

---

## 5. SSR "rendering failed" / blank screen na troca de telas

Diagnóstico provável: chamadas a `localStorage`, `crypto.randomUUID`, `window` ou `supabase.auth.getUser()` durante SSR em rotas autenticadas.

**Correções:**
- `_authenticated.tsx`: `beforeLoad` já checa `typeof window === "undefined"`, OK. Mas as rotas filhas chamam `supabase.auth.getUser()` em `useEffect` que dispara no SSR-hydration mismatch. Padronizar:
  - Mover toda chamada a `supabase` que está no corpo de componentes para dentro de `useQuery` (que é client-only por padrão com `enabled` no mount), ou guardar com `if (typeof window === "undefined") return null`.
- `studio.$id.tsx`: o `useEffect` que faz `crypto.randomUUID()` durante hidratação roda só client-side, mas o componente é renderizado no SSR sem dados → garantir loading skeleton estável (mesmo HTML server e client).
- `__root.tsx` `ErrorComponent`: passar a registrar `error.stack` no `console.error` para diagnóstico real (hoje só mostra `error.message`).
- Adicionar `errorComponent` + `pendingComponent` em **toda** rota de `_authenticated/*` para evitar telas brancas.
- Em `_authenticated.tsx`, `useRouterState` é OK, mas evitar `path.startsWith` em SSR (sem janela). Já protegido pelo redirect.

---

## 6. Performance / lag de navegação

- `router.tsx`: ativar `defaultPreload: "intent"` e `defaultPreloadStaleTime: 0` (já é 0). Adicionar `defaultPendingMinMs: 0`.
- `app-sidebar.tsx`: `<Link>` ganha `preload="intent"` para pré-carregar rota ao hover.
- Cada rota com `useQuery`: adicionar `staleTime: 30_000` para evitar refetch toda navegação.
- Substituir `useEffect` + `supabase.auth.getUser()` da sidebar por um único context `useAuth()` carregado uma vez no `__root.tsx` (evita 1 round-trip por troca de tela).
- Memoizar `groups` da sidebar (constante já é, OK).

---

## 7. Sistema de QR Card de 4 orientações (A/B/C/D)

A ideia: cada aluno tem **um único QR Card físico**. Ele segura o cartão na orientação correspondente à resposta — topo para cima = A, virado 90° à direita = B, 180° = C, 90° à esquerda = D. A câmera do professor lê todos os cartões da sala simultaneamente e registra a resposta por aluno na questão atual.

**Implementação:**

### 7a. Geração precisa do QR por aluno
- Em `students.tsx`, ao criar aluno, gerar `qr_code = "LK-{class_id_short}-{student_id_short}"` (já existe parecido — formalizar).
- Nova rota `/_authenticated/students.cards.tsx` (ou modal "Imprimir cartões") que gera folha A4 com 1 cartão por aluno:
  - QR code grande (300×300, error-correction H) usando `qrcode.react`.
  - **Marcadores de orientação** em cada lado do cartão: letras grandes A (topo), B (direita), C (base), D (esquerda) impressas fora do QR, para o aluno saber qual lado levantar.
  - Nome do aluno, turma e código abaixo.
  - Botão "Imprimir" (`window.print()` com `@media print`).

### 7b. Engine de leitura com detecção de orientação
- Novo arquivo `src/lib/qr-orientation.ts`:
  - Wrapper sobre `jsqr` (mais preciso para vários QRs simultâneos que `html5-qrcode`). Instalar `jsqr`.
  - Para cada QR detectado, `jsqr` retorna 3 cantos de posição (`location.topLeftCorner`, `topRightCorner`, `bottomLeftCorner`). Calcular o vetor `topLeft → topRight` e derivar o ângulo:
    ```
    angle = atan2(dy, dx) * 180 / PI
    if -45 <= angle < 45      → A
    if  45 <= angle < 135     → B
    if angle >= 135 || angle < -135 → C
    if -135 <= angle < -45    → D
    ```
- Nova rota/modo no `scan.tsx`:
  - Modo **Presença** (atual, registra leitura).
  - Modo **Resposta ao vivo**: requer `session_id` ativo + `question_index`. Cada QR lido vira um `INSERT` em `responses` com `answer = "A"|"B"|"C"|"D"`, `is_correct` calculado contra `correct_index` do bloco.
  - Loop de captura: a cada `requestAnimationFrame`, pega frame do `<video>` → `canvas` → `getImageData` → `jsqr` (modo `dontInvert`) → processa todos os códigos detectados na frame, dedup por `student_id + question_index`.

### 7c. Fluxo de aplicação ("Apresentar + coletar")
- Em `present.$id.tsx`: adicionar painel lateral retrátil com:
  - Botão **Iniciar sessão** → cria row em `sessions` (status `live`).
  - Mostra contador "X / Y alunos responderam" em tempo real via Supabase realtime (`responses` já está habilitada).
  - Mini-câmera embutida (mesma engine de 7b) ou link rápido para `/scan?session={id}&q={idx}`.
  - Ao avançar pergunta, `update sessions set current_question = idx`.
- Em `library.tsx` / `studio.tsx`: botão **Aplicar** abre seletor de turma → cria sessão → redireciona para `/present/$id?session=...`.

---

## 8. Migration

```sql
-- Reset covers neon antigas
UPDATE public.activities SET cover_color = NULL WHERE cover_color IS NOT NULL;
```
(Sem mudança de schema; nada de novo a granular.)

---

## 9. Pacote a instalar
- `jsqr` — leitura precisa de QR com posição (canto) para derivar rotação.

---

## 10. Resumo de arquivos a tocar

```
src/styles.css                         (sidebar escura, ajustes light)
src/router.tsx                         (preload intent)
src/routes/__root.tsx                  (ErrorComponent loga stack, AuthContext)
src/routes/_authenticated.tsx          (remover isFullBleed do /studio/$id)
src/routes/_authenticated/studio.tsx   (covers sóbrias, invalidate + navigate)
src/routes/_authenticated/studio.$id.tsx (errorComponent, IDs seguros, manter back)
src/routes/_authenticated/students.tsx (cartão A4 imprimível com A/B/C/D)
src/routes/_authenticated/scan.tsx     (engine jsqr, modo presença/resposta)
src/routes/_authenticated/present.$id.tsx (sessão ao vivo, contador realtime)
src/components/app-sidebar.tsx         (preload intent, classes sidebar tokens)
src/hooks/use-auth.tsx                 (NOVO — context único de usuário)
src/lib/qr-orientation.ts              (NOVO — wrapper jsqr + ângulo→letra)
```

Fora de escopo desta rodada (zero novos itens — tudo acima entra agora).
