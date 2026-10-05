# GuardianVoice

An accessibility and safety **product prototype** built with React and Vite. The repository combines voice-triggered interaction, a map interface, camera-assisted scene descriptions and an AI chat interface.

## Explore the implementation

- `src/App.jsx`: screens, browser speech recognition, camera and AI-service requests.
- `src/index.css`: interface styling and responsive layout.
- `package.json`: development and build commands.

```bash
npm ci
npm run dev
npm run build
```

The UI can be explored without an API key. Speech recognition depends on browser support and microphone permissions; AI responses and scene descriptions require external services.

## Prototype boundaries

This project integrates hosted AI services; it does not contain a trained speech or vision model or a measured accuracy benchmark. It has not been validated as an emergency-response system. The current frontend uses `VITE_OPENAI_API_KEY`, which Vite embeds into browser code. **Do not deploy a real API key with this design.** A production implementation needs an authenticated backend proxy, input/rate limits, explicit microphone/camera consent and end-to-end testing of any emergency-contact flow.

The repository name records the intended event context; this README makes no claim of an award or event result. For model implementation and evaluation, see [Causal LM Lab](https://github.com/zoga228/causal-lm-lab) and [Validation Stress Lab](https://github.com/zoga228/validation-stress-lab).
