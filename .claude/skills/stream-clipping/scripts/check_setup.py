#!/usr/bin/env python3
"""Verify everything the stream-clipping skill needs, then run a real end-to-end test.

Usage: python3 check_setup.py [--fix]
  --fix  pip-install missing Python packages (faster-whisper, yt-dlp) before checking.

Exit code 0 means every required check passed.
"""
import importlib.util, json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
results = []


def check(name, ok, detail="", required=True, hint=""):
    results.append((name, ok, required))
    mark = "PASS" if ok else ("FAIL" if required else "WARN")
    if hint and not ok:
        detail = hint
    print(f"[{mark}] {name}" + (f" - {detail}" if detail else ""))
    return ok


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def main():
    if "--fix" in sys.argv:
        missing = [p for p, m in (("faster-whisper", "faster_whisper"), ("yt-dlp", "yt_dlp"))
                   if importlib.util.find_spec(m) is None]
        if missing:
            print("installing:", " ".join(missing))
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", *missing])

    v = sys.version_info
    check("Python >= 3.10", v >= (3, 10), f"{v.major}.{v.minor}.{v.micro} at {sys.executable}")

    ff = shutil.which("ffmpeg")
    if check("ffmpeg on PATH", bool(ff), ff, hint="install: Mac `brew install ffmpeg`, Windows `winget install Gyan.FFmpeg`"):
        filters = run(["ffmpeg", "-hide_banner", "-filters"]).stdout
        for f in ("ass", "loudnorm", "vstack"):
            check(f"ffmpeg filter '{f}'", f" {f} " in filters,
                  hint="needs an ffmpeg build with libass (captions)" if f == "ass" else "")
    check("ffprobe on PATH", bool(shutil.which("ffprobe")))
    check("faster-whisper installed", importlib.util.find_spec("faster_whisper") is not None, hint="pip install faster-whisper")
    check("yt-dlp installed (only for VOD links)", importlib.util.find_spec("yt_dlp") is not None or bool(shutil.which("yt-dlp")),
          required=False, hint="pip install yt-dlp")

    if not all(ok for _, ok, req in results if req):
        return summary()

    # end-to-end: synthetic 1080p60 stream with a tone, transcribe, render a captioned 9:16 clip
    tmp = tempfile.mkdtemp(prefix="clipcheck_")
    src = os.path.join(tmp, "test.mp4")
    r = run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=60:duration=8",
             "-f", "lavfi", "-i", "sine=frequency=440:duration=8", "-c:v", "libx264", "-c:a", "aac", src])
    check("generate test video", r.returncode == 0, r.stderr.strip()[:200])

    clip = os.path.join(HERE, "clip.py")
    print("loading Whisper model (first run downloads ~140 MB)...")
    r = run([sys.executable, clip, "transcribe", src, "--outdir", tmp])
    words = os.path.join(tmp, "test.words.json")
    check("Whisper transcription runs", r.returncode == 0 and os.path.exists(words),
          (r.stderr.strip().splitlines() or [""])[-1][:200])

    # fake words so the caption path is exercised even though the test audio is a tone
    with open(words, "w") as f:
        json.dump([{"start": 2.0, "end": 2.6, "word": "setup"}, {"start": 2.6, "end": 3.4, "word": "works"}], f)
    out = os.path.join(tmp, "out.mp4")
    r = run([sys.executable, clip, "render", src, "1", "6", out, "--words", words])
    ok = r.returncode == 0 and os.path.exists(out)
    check("render 9:16 clip with captions", ok, r.stderr.strip()[-200:])
    if ok:
        p = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
                 "-of", "csv=p=0", out]).stdout.strip()
        check("output is 1080x1920 @ 30fps", p.startswith("1080,1920,30/1"), p)
        lufs = run(["ffmpeg", "-hide_banner", "-i", out, "-af", "loudnorm=print_format=json", "-f", "null", "-"]).stderr
        try:
            i = float(json.loads(lufs[lufs.rindex("{"):])["input_i"])
            check("loudness ~ -14 LUFS", abs(i + 14) < 1.5, f"{i} LUFS")
        except Exception as e:
            check("loudness measurable", False, str(e))
    shutil.rmtree(tmp, ignore_errors=True)
    return summary()


def summary():
    failed = [n for n, ok, req in results if req and not ok]
    print("\nALL REQUIRED CHECKS PASSED" if not failed else f"\n{len(failed)} required check(s) failed: {', '.join(failed)}")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
