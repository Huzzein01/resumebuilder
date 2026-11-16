---
name: stream-clipping
description: Turn livestream recordings/VODs into captioned vertical clips and post them to TikTok and Instagram Reels. Use when the user wants to clip, cut, reframe, caption, or publish highlights from a stream or long video.
model: sonnet
---

# Stream Clipping → TikTok / Instagram

Built from two sources (reviewed, adapted, not copied wholesale):
- affaan-m/everything-claude-code `video-editing` skill (FFmpeg / Remotion pipeline)
- wilwaldon/Claude-Code-Video-Toolkit (curated index: Remotion skill, op7418/Youtube-clipper-skill, digitalsamba toolkit)

Principle: edit real footage, don't generate it. AI compresses and structures; the user makes final taste calls.

## Pipeline
1. **Source**: local OBS recording (preferred) or VOD via `yt-dlp <url>`. Nothing clips live; work happens after the stream.
Script: `CLIP="${CLAUDE_SKILL_DIR}/scripts/clip.py"` (if unset, use the absolute path of this skill folder). Setup once: `pip install yt-dlp faster-whisper`; ffmpeg must have libass. The Whisper model downloads from huggingface.co on first run.

2. **Transcribe**: `python3 "$CLIP" transcribe raw.mp4` → `raw.words.json` (word timestamps) + `raw.srt`.
3. **Find moments**: from transcript + `silencedetect` + scene detection + (Twitch) chat-spike timestamps, pick 5-10 candidates of 15-60s. Each needs a hook in the first 2s, a payoff, and a clean ending. Give each a title, timestamps, and reason. Show the list and get approval before rendering.
4. **Render**: `python3 "$CLIP" render raw.mp4 START END out.mp4` cuts (re-encoded, so input-side seeking is frame-accurate), center-crops to 1080x1920, burns word-synced captions inside platform safe zones, normalizes to -14 LUFS, and outputs H.264/AAC 30fps. For gameplay + facecam use `--layout stack --cam x,y,w,h` (facecam rectangle in source pixels; find it from a frame grab). `--no-captions` skips captions. Use Remotion only for animated overlays the script can't do.
5. **Review**: show each rendered clip; the user approves each one. Never publish unapproved.
6. **Publish** (below).

## Connected tools to prefer over hand-rolled ffmpeg
- Viewmax: `find_clips`, `cut_clip`, `add_captions`, `edit_timeline`, workflow `long-form-video-editing` (needs a paid plan).
- HiggsField: `reframe`, `virality_predictor`, `tiktok_accounts`, `tiktok_prepare_publish`, `tiktok_publish_status`, `tiktok_music_trending`.
- Posty plugin: publishes/schedules one clip to TikTok and Instagram Reels, with browser sign-in.

## Publishing rules
- **Which route**: run ToolSearch "posty". If Posty tools are found, use them for both TikTok and Instagram. Otherwise use HiggsField for TikTok (upload the clip with `media_upload` → PUT → `media_confirm`, since `tiktok_prepare_publish` only takes a HiggsField-hosted URL; the user then submits its review form, and you don't call `tiktok_publish` yourself; videos must be 3-600s at 23-60fps) and tell the user Instagram needs Posty enabled (the raw API notes below are for reference only).
- **Done means**: the publish tool returned a post ID or URL (or HiggsField `tiktok_publish_status` reports published), and you've reported that link back for each clip and platform.
- **TikTok**: unaudited API apps can only post privately, and those posts stay private after the audit passes. Do a single private test post first and confirm visibility before batching. Always confirm caption, hashtags, and account with the user before posting.
- **Instagram Reels**: needs a professional account; two-step flow (create container with `media_type=REELS` + `video_url`, then publish); limit 100 API posts per rolling 24h; H.264 + AAC MP4; keep Reels at or under 90s to be safe.
- Posting is outward-facing: get explicit approval per batch, report success/failure faithfully, and never retry a failed publish blindly (risk of duplicates).
- Don't reupload third-party content (game music, other streamers' clips, DMCA-flagged audio) without the user confirming rights.

## Optional add-ons from the source repos
- Remotion for animated overlays/lower thirds: `npx skills add remotion`
- YouTube-style chaptering/clipping: `npx skills add https://github.com/op7418/Youtube-clipper-skill` (needs yt-dlp, ffmpeg with libass, pysrt)
- Full upstream skill: `npx skills add https://github.com/affaan-m/everything-claude-code --skill video-editing`

## Handy FFmpeg (moment finding, manual fallback)
- Manual 9:16 cut: `ffmpeg -ss START -to END -i raw.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v libx264 -crf 19 -c:a aac out.mp4`
- Silence: `ffmpeg -i in.mp4 -af silencedetect=noise=-30dB:d=2 -f null - 2>&1 | grep silence`
- Scenes: `ffmpeg -i in.mp4 -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -f null - 2>&1 | grep showinfo`
- Proxy for fast review: `ffmpeg -i raw.mp4 -vf scale=960:-2 -c:v libx264 -preset ultrafast -crf 28 proxy.mp4`
