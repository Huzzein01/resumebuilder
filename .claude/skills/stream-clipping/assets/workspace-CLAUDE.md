# Stream clipping workspace

Use the `stream-clipping` skill for all work here. Its scripts live at
`.claude/skills/stream-clipping/scripts/` (or `~/.claude/skills/stream-clipping/scripts/`).

## Folders
- `1-raw/` — source recordings. Read only: never edit, move, rename or delete anything here.
- `2-working/` — transcripts, clip lists, test renders. All intermediate files go here,
  in a subfolder named after the source video.
- `3-finished/` — final clips only.

## Workflow
1. New videos = files in `1-raw/` with no matching subfolder in `2-working/`.
2. Transcribe: `python3 <scripts>/clip.py transcribe 1-raw/<video> --outdir 2-working/<name>/`
3. Propose the best 5-10 moments (15-60s each): title, timestamps, why it works. Save the list to
   `2-working/<name>/clips.md`. Wait for my OK.
4. Render approved clips: `python3 <scripts>/clip.py render 1-raw/<video> START END
   3-finished/<name>_<NN>_<short-title>.mp4 --words 2-working/<name>/<name>.words.json`
   (add `--layout stack --cam x,y,w,h` if there's a facecam; find it from a frame grab first).
5. Next to each clip write `<same-name>.txt` with a suggested hook caption and hashtags for TikTok and Instagram.

## Posting
Do NOT post, upload or schedule anything anywhere. I review `3-finished/` and post myself.
