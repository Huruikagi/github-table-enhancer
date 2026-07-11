# Store Demo Video

Run the following command from the repository root to rebuild the extension and record the store demo:

```powershell
pnpm demo:video
```

The command writes `github-table-enhancer-demo.webm` to this directory. The generated WebM file is ignored by Git because it is a large, reproducible artifact.

The recording uses a deterministic local GitHub-style fixture, loads the unpacked extension from `dist`, and demonstrates Freeze, Filter, Fit, Wrap, Focus mode, and Reset at 1280 x 720. Edit `e2e/demo-video.spec.ts` to change the copy, pacing, fixture data, or scenario.
