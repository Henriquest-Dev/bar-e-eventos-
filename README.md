# Bar & Eventos — website

Site estático (HTML/CSS/JS, sem build). Abrir `index.html` ou servir a pasta:

```
python3 -m http.server 8000
```

## Hero: viagem Istambul → Maputo

A animação é desenhada em `<canvas>` por `js/journey.js`, controlada pelo scroll,
a partir de 5 cenários + avião + nuvem (`assets/viagem/`, ~2.7 MB no total).
Reproduz a lógica do `compose_premium.py` original em vez de usar os 300 frames
pré-renderizados (~175 MB), por isso fica nítida em qualquer ecrã e carrega rápido.

- `env_*.webp` — cenários 1672×941 (desktop)
- `env_*-m.webp` — cenários 960×540 (telemóvel)
- `plane_01.webp`, `cloud_01.webp` — elementos com transparência
- `poster.jpg` — fundo enquanto o canvas carrega

Os originais (frames JPG, SVG, PNG, vídeo preview) ficam fora do repositório.
