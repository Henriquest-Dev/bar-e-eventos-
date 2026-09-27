# Lokanta — cozinha turca em Maputo

Site estático (HTML/CSS/JS, sem build). Servir a pasta localmente:

```
python3 -m http.server 8000
```

Publicado via GitHub Pages (Settings → Pages → Deploy from a branch → esta branch, pasta `/`).

## Hero: a viagem Istambul → Maputo

`js/hero.js` compõe a cena top-down em camadas num `<canvas>`, com a câmara controlada pelo scroll
(700vh no desktop, 560vh no telemóvel):

| Camada | Asset | Movimento |
|---|---|---|
| Chão | `env_0*.webp` (5 cenários) | pan contínuo + zoom ligado à altitude |
| Névoa de altitude | — | mais forte em cruzeiro |
| Sombras das nuvens | `cloud_01` (silhueta desfocada) | seguem as nuvens baixas, afastadas pela altitude |
| Nuvens baixas | `cloud_01` | parallax lento |
| Rota pontilhada | — | rasto atrás do avião |
| Sombra do avião | `plane_01` (silhueta) | afasta-se em cruzeiro, cola ao avião ao aterrar |
| Avião | `plane_01` | inclinação suave, descola de baixo, sai por cima no fim |
| Nuvens altas | `cloud_01` (desfocada) | parallax rápido, por cima do avião |
| Bancos de nuvens | `cloud_01` | escondem a troca entre cenários |

Timeline: descolagem em Istambul (0–14%) → cruzeiro por Mediterrâneo, África Oriental e Costa (14–70%)
→ descida com zoom sobre Maputo (70–90%) → o avião sai de cena e entra o restaurante (88–100%).

Com `prefers-reduced-motion` a animação é desligada e mostra-se diretamente a chegada.

Os originais (300 frames JPG, SVG, vídeo preview) ficam fora do repositório (203 MB → 2 MB em WebP).
