# Docão Crush 🐷

Jogo de combinar 3 (estilo Candy Crush) com o Docão, o porquinho da Cheers. Roda no navegador, no celular e no computador.

**Jogar:** https://docao-crush.valentimm.workers.dev

## Como joga

Arraste (ou toque em duas) peças vizinhas pra trocar e formar 3 ou mais iguais em linha. As peças são **bacon, milho, ovo, pimentão, berinjela e cenoura**, todas desenhadas em vetor no próprio código.

| Combinação | Vira | Efeito |
|---|---|---|
| 4 em linha | **Listrado** | limpa a linha ou a coluna inteira |
| L ou T | **Embrulhado** | explode 3x3 em volta |
| 5 em linha | **Bomba Docão** | troque com uma peça pra sumir com todas daquela cor |

Combos especiais (trocando dois especiais):
- listrado + listrado: cruz (linha + coluna)
- listrado + embrulhado: 3 linhas + 3 colunas
- embrulhado + embrulhado: explosão 5x5
- bomba + peça comum: some toda a cor
- bomba + listrado/embrulhado: toda a cor vira listrado/embrulhado e explode
- bomba + bomba: limpa o tabuleiro

Também tem cascata com gravidade, troca inválida que volta, embaralhamento automático quando não há jogada e dica depois de 5 segundos parado.

## Fases

São **200 fases**, divididas em episódios de 15 (Chiqueiro do Docão, Milharal Dourado, Lamaçal Profundo, Churrascaria Cheers…).

- **Fases 1 a 10** foram feitas à mão como tutorial, e cada uma apresenta uma mecânica.
- **Fases 11 a 200** saem de um gerador determinístico (`src/levels.js`), com seed fixa por número de fase. Ele escolhe o formato do tabuleiro (cheio, cantos cortados, diamante, focinho, ilhas, moldura, escada…), o tamanho (7x7 a 9x9), o número de cores, os bloqueios e o objetivo. A dificuldade sobe ao longo do mapa, toda fase terminada em 0 ou 5 é "difícil" e a seguinte dá um respiro.
- **Objetivos:** pontuação, coletar N peças de um tipo, limpar a **geleia**, levar **trufas** até o fundo, quebrar as **cercas** ou limpar a **lama**.
- **Bloqueios:** cerca de madeira (1 ou 2 golpes), **lama**, que se espalha se você não limpar nenhuma na jogada, e **corrente**, que prende a peça até ela entrar numa combinação.
- **Jogadas limitadas e 1 a 3 estrelas.** Se sobrarem jogadas, a "Festa do Docão" transforma as que sobraram em listrados e dá pontos extras.

### Afinação da dificuldade

`scripts/tune.mjs` joga cada fase com um robô guloso (`src/bot.js`) e ajusta as jogadas até ele vencer na taxa-alvo: quase sempre no começo e cerca de metade das vezes no fim. Quando uma fase gerada fica impossível, o script troca pra outra variante. O resultado fica em `src/tuning.js`. Pra ver as taxas de vitória: `npm run sim`.

## Progresso

Fases liberadas, estrelas, recordes e a opção de som ficam no `localStorage` do navegador. Os sons são sintetizados na hora com WebAudio, sem arquivos.

## Desenvolvimento

```bash
npm install
npm test            # motor (combinações, especiais, combos, bloqueios) + fases (todas começam com jogada, robô vence amostra)
npm run build       # dist/index.html + dist/app.js (esbuild)
npx serve dist      # ou qualquer servidor estático
```

Pra abrir direto numa fase: `?fase=57&livre`.

Estrutura:
- `src/engine.js`: motor puro, sem DOM. Cada jogada devolve "fases" com snapshot pra animação.
- `src/levels.js`, `src/tuning.js`: fases à mão, gerador e ajuste.
- `src/render.js`: tabuleiro em canvas, com animação de troca, estouro, queda, raios e partículas.
- `src/art.js`: peças e Docão desenhados em canvas/SVG.
- `src/audio.js`: efeitos sonoros.
- `src/main.js`: telas (menu, mapa, fase), toque e mouse, progresso.

## Deploy

É um Cloudflare Worker (`docao-crush`) com o HTML e o JS embutidos no script:

```bash
npm run build && node scripts/make-worker.mjs /tmp/deploy-docao-crush.js
```

O arquivo gerado é uma função que faz o upload pela API da Cloudflare (`PUT /accounts/{conta}/workers/scripts/docao-crush`). `/health` responde com a versão publicada.
