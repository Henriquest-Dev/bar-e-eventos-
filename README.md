# Steak House — proposta de site

Conceito de site para um restaurante de grelhados turcos em Maputo
(Instagram: [@steak_house_restorant](https://www.instagram.com/steak_house_restorant/)).
Site estático (HTML/CSS/JS, sem build). Para ver localmente:

```
python3 -m http.server 8000
```

Publicado no GitHub Pages a partir da branch `gh-pages`.

## Estrutura

- `index.html` — página única: hero, menu em destaque, "O que há na nossa mesa", a casa, reservas, rodapé.
- `css/style.css` — tokens (mármore, vermelho pul biber, azul de İznik), layout e animações.
- `js/menu-data.js` — **os pratos do menu** (nome turco, nome em português, descrição, ingredientes)
  e o número de WhatsApp das reservas (`window.WHATSAPP`). É o ficheiro a editar para mudar o menu.
- `js/main.js` — menu em destaque (troca de prato com rotação, separadores, carrossel, deslizar no
  telemóvel), categorias, formulário de reserva (abre o WhatsApp com a mensagem pronta) e o parallax
  dos ingredientes.
- `assets/dishes/<id>.webp` — pratos recortados, vistos de cima (quadrados, fundo transparente).
- `assets/ingredients/` — especiarias e folhas recortadas.
- `assets/texture/marble.webp` — textura de mármore gerada (sem costuras).
- `creditos.html` — autoria e licença de cada fotografia.

## Trocar pelas fotografias do restaurante

Guardar cada prato em `assets/dishes/<id>.webp` com o mesmo `id` de `js/menu-data.js`,
de preferência visto de cima e recortado (PNG/WebP transparente, 900×900).
Depois retirar a entrada correspondente de `creditos.html`.

As fotografias provisórias vêm do Wikimedia Commons e do Openverse (licenças CC BY, CC BY-SA e CC0).

## Outras pastas

- `videos/reel-istambul-maputo/` — Reel do Instagram (HyperFrames) feito numa fase anterior.
