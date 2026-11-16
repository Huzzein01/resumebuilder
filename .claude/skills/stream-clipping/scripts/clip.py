#!/usr/bin/env python3
"""Stream clipping helper: transcribe, cut, reframe to 9:16, caption, normalize.

Usage:
  clip.py transcribe <video> [--model base]
      -> <video-base>.words.json (word timestamps) + <video-base>.srt
  clip.py render <video> <start> <end> <out.mp4> [--layout center|stack]
      [--cam x,y,w,h] [--words FILE] [--no-captions]

Times are seconds or HH:MM:SS(.ms). Needs ffmpeg with libass; transcribe also
needs faster-whisper (its model downloads from huggingface.co on first use).
"""
import argparse, json, os, subprocess, sys, tempfile


def ts(v):
    parts = [float(p) for p in str(v).split(":")]
    while len(parts) < 3:
        parts.insert(0, 0.0)
    return parts[0] * 3600 + parts[1] * 60 + parts[2]


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def ass_time(t):
    cs = int(round(max(t, 0) * 100))
    h, cs = divmod(cs, 360000); m, cs = divmod(cs, 6000); s, cs = divmod(cs, 100)
    return f"{h}:{m:02}:{s:02}.{cs:02}"


def transcribe(video, model_name):
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="auto", compute_type="int8")
    segments, _ = model.transcribe(video, word_timestamps=True, vad_filter=True)
    words, srt = [], []
    for i, seg in enumerate(segments, 1):
        srt.append(f"{i}\n{srt_time(seg.start)} --> {srt_time(seg.end)}\n{seg.text.strip()}\n")
        for w in seg.words or []:
            words.append({"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word.strip()})
        print(f"[{seg.start:8.1f}] {seg.text.strip()}")
    base = os.path.splitext(video)[0]
    with open(base + ".words.json", "w") as f:
        json.dump(words, f)
    with open(base + ".srt", "w") as f:
        f.write("\n".join(srt))
    print(f"wrote {base}.words.json and {base}.srt")


def ass_escape(s):
    return s.replace("\\", "").replace("{", "(").replace("}", ")")


def build_ass(words, start, end, path, per_line=3):
    """Word-synced captions, a few words per line, current word highlighted yellow."""
    clip = [w for w in words if w["end"] > start and w["start"] < end]
    head = (
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
        "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, "
        "Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        # bottom-centre, lifted 560px and 160px off the right edge to clear TikTok/Reels UI
        "Style: Cap,DejaVu Sans,78,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,"
        "100,100,0,0,1,6,2,2,90,160,560,1\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    lines = []
    for i in range(0, len(clip), per_line):
        group = clip[i:i + per_line]
        for j, w in enumerate(group):
            s = max(w["start"], start) - start
            e = min(group[j + 1]["start"] if j + 1 < len(group) else w["end"], end) - start
            text = " ".join(
                ("{\\c&H00E5FF&}" + ass_escape(g["word"].upper()) + "{\\c&HFFFFFF&}")
                if k == j else ass_escape(g["word"].upper())
                for k, g in enumerate(group))
            lines.append(f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Cap,,0,0,0,,{text}")
    with open(path, "w") as f:
        f.write(head + "\n".join(lines) + "\n")
    return len(clip)


def render(a):
    start, end = ts(a.start), ts(a.end)
    if a.layout == "stack":  # gameplay on top, facecam below, each 1080x960
        x, y, w, h = a.cam.split(",")
        vf = (f"[0:v]split=2[g][c];[g]crop=ih*9/8:ih,scale=1080:960[top];"
              f"[c]crop={w}:{h}:{x}:{y},scale=1080:960[bot];[top][bot]vstack[v]")
    else:
        vf = "[0:v]crop=ih*9/16:ih,scale=1080:1920[v]"

    words_path = a.words or os.path.splitext(a.video)[0] + ".words.json"
    if not a.no_captions:
        if os.path.exists(words_path):
            ass = os.path.join(tempfile.mkdtemp(), "caps.ass")
            with open(words_path) as f:
                if build_ass(json.load(f), start, end, ass):
                    vf = vf[:-3] + "[pre];[pre]ass=" + ass + "[v]"
        else:
            print(f"note: {words_path} not found; rendering without captions (run transcribe first)")

    # input-side -ss resets output timestamps to 0, so captions are relative to start
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
           "-ss", str(start), "-to", str(end), "-i", a.video,
           "-filter_complex", vf, "-map", "[v]", "-map", "0:a?",
           "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
           "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
           "-r", "30", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
           "-movflags", "+faststart", a.out]
    subprocess.run(cmd, check=True)
    print(f"wrote {a.out} ({end - start:.1f}s, 1080x1920)")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("transcribe"); t.add_argument("video"); t.add_argument("--model", default="base")
    r = sub.add_parser("render")
    for n in ("video", "start", "end", "out"):
        r.add_argument(n)
    r.add_argument("--layout", choices=["center", "stack"], default="center")
    r.add_argument("--cam", help="facecam crop x,y,w,h in source pixels (stack layout)")
    r.add_argument("--words"); r.add_argument("--no-captions", action="store_true")
    a = p.parse_args()
    if a.cmd == "transcribe":
        transcribe(a.video, a.model)
    elif a.layout == "stack" and not a.cam:
        sys.exit("--cam x,y,w,h is required for --layout stack")
    else:
        render(a)


if __name__ == "__main__":
    main()
