# Lokanta — cozinha turca em Maputo

Site estático (HTML/CSS/JS, sem build). Servir a pasta localmente:

```
python3 -m http.server 8000
```

Publicado via GitHub Pages (Settings → Pages → Deploy from a branch → esta branch, pasta `/`).

## Hero: a travessia de Istambul a Maputo

O vídeo ilustrado (aguarela / miniatura otomana, 10 s) foi convertido em 120 imagens WebP
(`assets/viagem-mar/d/` 1280×720 para desktop, `m/` 960×540 para telemóvel). `js/hero.js` lê
apenas a posição do scroll nativo, escolhe a imagem e funde-a com a seguinte num `<canvas>`,
para o movimento ser contínuo nos dois sentidos. As imagens carregam progressivamente
(de 8 em 8, depois 4, 2 e 1), por isso a viagem é navegável logo nos primeiros segundos.

- Legenda numa cartela (moldura das miniaturas otomanas): Istambul → A travessia → Maputo.
- No fim, a cartela do restaurante com "Ver o menu" e "Reservar mesa".
- Com `prefers-reduced-motion`, mostra a última imagem e a chegada, sem scrub.

`assets/viagem/` (vistas aéreas da versão anterior) continua no repositório e é usado pelo Reel
em `videos/reel-istambul-maputo/`.

Os originais (300 frames JPG, SVG, vídeo preview) ficam fora do repositório (203 MB → 2 MB em WebP).
