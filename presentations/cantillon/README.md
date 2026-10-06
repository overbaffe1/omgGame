# Richard Cantillon — 3D presentation

Build the deck and speaker notes with:

```bash
npm install
node build.js --preview
```

The presentation embeds original `.glb` models as native PowerPoint 3D objects. Slide transitions use Morph (with a Fade fallback), and each object has a transparent fallback render. To rebuild the models, install Python dependencies (`bpy`, `global-land-mask`, `numpy`) and run `python3 models/make_models.py [keys...]` from this directory. The build script requires Blender's Cycles renderer.

The portrait is Nicolas de Largillière's *The Artist and his Family* (c. 1710); its identification as Richard Cantillon is disputed, so it is shown only as a possible likeness and is explicitly captioned that way. See `../../exports/cantillon-presentation-sources.md` for the references and historical caveats.
