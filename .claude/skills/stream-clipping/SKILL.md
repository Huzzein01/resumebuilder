---
name: stream-clipping
description: Turn livestream recordings/VODs into captioned vertical clips and post them to TikTok and Instagram Reels. Use when the user wants to clip, cut, reframe, caption, or publish highlights from a stream or long video.
---

# Stream Clipping → TikTok / Instagram

Built from two sources (reviewed, adapted, not copied wholesale):
- affaan-m/everything-claude-code `video-editing` skill (FFmpeg / Remotion pipeline)
- wilwaldon/Claude-Code-Video-Toolkit (curated index: Remotion skill, op7418/Youtube-clipper-skill, digitalsamba toolkit)

Principle: edit real footage, don't generate it. AI compresses and structures; the user makes final taste calls.

## Pipeline
1. **Source**: local OBS recording (preferred) or VOD via `yt-dlp <url>`. Nothing clips live; work happens after the stream.
2. **Transcribe**: `ffmpeg -i raw.mp4 -vn -acodec pcm_s16le -ar 16000 audio.wav`, then Whisper / faster-whisper for word-level timestamps.
3. **Find moments**: from transcript + `silencedetect` + scene detection + (Twitch) chat-spike timestamps, pick 5-10 candidates of 15-60s. Each needs a hook in the first 2s, a payoff, and a clean ending. Give each a title, timestamps, and reason. Show the list and get approval before rendering.
4. **Cut** (frame-accurate: put `-ss` after `-i`, re-encode, no `-c copy` for final clips):
   `ffmpeg -i raw.mp4 -ss START -to END -c:v libx264 -crf 18 -c:a aac clip.mp4`
5. **Reframe to 9:16** (1080x1920): center crop `-vf "crop=ih*9/16:ih,scale=1080:1920"`. For facecam + gameplay, stack: gameplay on top, facecam below, via `filter_complex vstack`. Prefer face/subject tracking when available.
6. **Captions**: word-synced, burned in, large, inside safe zones (keep ~150px clear at the bottom and right edge for platform UI). Requires ffmpeg with libass, or Remotion for animated styles.
7. **Loudness**: `-af loudnorm=I=-16:TP=-1.5:LRA=11`.
8. **Review**: user approves each clip. Never publish unapproved.
9. **Publish** (below).

## Connected tools to prefer over hand-rolled ffmpeg
- Viewmax: `find_clips`, `cut_clip`, `add_captions`, `edit_timeline`, workflow `long-form-video-editing` (needs a paid plan).
- HiggsField: `reframe`, `virality_predictor`, `tiktok_accounts`, `tiktok_prepare_publish`, `tiktok_publish_status`, `tiktok_music_trending`.
- Instagram has no connector yet; the Posty plugin or Windsor.ai connector are candidates. Ask before installing.

## Publishing rules
- **TikTok**: unaudited API apps can only post privately, and those posts stay private after the audit passes. Do a single private test post first and confirm visibility before batching. Always confirm caption, hashtags, and account with the user before posting.
- **Instagram Reels**: needs a professional account; two-step flow (create container with `media_type=REELS` + `video_url`, then publish); limit 100 API posts per rolling 24h; H.264 + AAC MP4; keep Reels at or under 90s to be safe.
- Posting is outward-facing: get explicit approval per batch, report success/failure faithfully, and never retry a failed publish blindly (risk of duplicates).
- Don't reupload third-party content (game music, other streamers' clips, DMCA-flagged audio) without the user confirming rights.

## Optional add-ons from the source repos
- Remotion for animated overlays/lower thirds: `npx skills add remotion`
- YouTube-style chaptering/clipping: `npx skills add https://github.com/op7418/Youtube-clipper-skill` (needs yt-dlp, ffmpeg with libass, pysrt)
- Full upstream skill: `npx skills add https://github.com/affaan-m/everything-claude-code --skill video-editing`

## Handy FFmpeg
- Silence: `ffmpeg -i in.mp4 -af silencedetect=noise=-30dB:d=2 -f null - 2>&1 | grep silence`
- Scenes: `ffmpeg -i in.mp4 -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -f null - 2>&1 | grep showinfo`
- Proxy for fast review: `ffmpeg -i raw.mp4 -vf scale=960:-2 -c:v libx264 -preset ultrafast -crf 28 proxy.mp4`
