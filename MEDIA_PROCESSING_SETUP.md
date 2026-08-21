# NEXA server-side media-processing readiness

The Video & Audio Tools page processes only browser-safe operations locally. It **does not** pretend to convert MP4, MOV, WebM, MP3, OGG, or compressed video when an encoder is unavailable.

## Required server-only configuration for a future FFmpeg worker

| Variable | Purpose |
|---|---|
| `NEXA_MEDIA_PROCESSOR=ffmpeg-worker` | Explicitly enables the worker capability boundary. |
| `NEXA_MEDIA_WORKER_URL` | Internal authenticated URL for a separately deployed FFmpeg job worker. |
| `NEXA_MEDIA_WEBHOOK_SECRET` | Shared secret used to verify worker completion callbacks before returning a processed result. |

The worker must accept only authorized stored source files, write outputs to S3-compatible storage, and sign a completion callback. The browser must never submit a claimed conversion status, worker URL, or completion result as proof of success.

> The current application exposes a credential-free capability query only. It deliberately does not include an upload endpoint, job queue, FFmpeg binary, provider credentials, or automatic activation of server processing.
