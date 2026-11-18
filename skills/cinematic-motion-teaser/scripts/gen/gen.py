"""Local SDXL generator for NearMatch teaser assets (RealVisXL V5 Lightning).

Usage:
  /tmp/claude-1000/-home-mesaid-nearmatch-motion/genvenv/bin/python -I gen.py jobs.json

jobs.json = [{"name": "maya", "prompt": "...", "negative": "...(optional)",
              "width": 832, "height": 1472, "seeds": [1,2,3], "steps": 6, "cfg": 1.8,
              "outdir": "/abs/path"}]
Writes <outdir>/<name>_s<seed>.png (full) and <outdir>/<name>_s<seed>_prev.jpg (preview).
Uses only the local HF cache (HF_HUB_OFFLINE=1).
"""
import json
import os
import sys
import time

os.environ.setdefault("HF_HUB_OFFLINE", "1")
# NOTE: no expandable_segments -- it raised "CUDA driver error: out of memory" on WSL2.
# GEN_OFFLOAD: "group" (default; UNet streamed leaf-by-leaf, TEs+VAE resident -- fits 6 GB
# at 832x1472 with CFG), "model" (enable_model_cpu_offload; OOMs on 6 GB at 832x1472),
# "seq" (enable_sequential_cpu_offload; slowest, lowest VRAM).
OFFLOAD = os.environ.get("GEN_OFFLOAD", "group")

import torch  # noqa: E402
from diffusers import AutoencoderKL, DPMSolverSDEScheduler, StableDiffusionXLPipeline  # noqa: E402

MODEL = "SG161222/RealVisXL_V5.0_Lightning"
VAE = "madebyollin/sdxl-vae-fp16-fix"

NEGATIVE = (
    "cartoon, anime, illustration, painting, cgi, 3d render, plastic skin, airbrushed, "
    "doll, waxy skin, deformed, disfigured, mutated, bad anatomy, extra fingers, missing fingers, "
    "fused fingers, extra limbs, cross-eyed, asymmetrical eyes, bad teeth, text, letters, "
    "watermark, logo, signature, caption, blurry face, out of focus face, oversaturated, "
    "overexposed, harsh flash, lowres, jpeg artifacts"
)


def load():
    vae = AutoencoderKL.from_pretrained(VAE, torch_dtype=torch.float16)
    pipe = StableDiffusionXLPipeline.from_pretrained(
        MODEL, vae=vae, torch_dtype=torch.float16, variant="fp16", use_safetensors=True
    )
    pipe.scheduler = DPMSolverSDEScheduler.from_config(
        pipe.scheduler.config, use_karras_sigmas=True
    )
    if OFFLOAD == "group":
        cuda = torch.device("cuda")
        pipe.unet.enable_group_offload(
            onload_device=cuda,
            offload_device=torch.device("cpu"),
            offload_type="leaf_level",
            use_stream=True,
        )
        pipe.text_encoder.to(cuda)
        pipe.text_encoder_2.to(cuda)
        pipe.vae.to(cuda)
    elif OFFLOAD == "seq":
        pipe.enable_sequential_cpu_offload()
    else:
        pipe.enable_model_cpu_offload()
    pipe.vae.enable_slicing()
    pipe.vae.enable_tiling()
    return pipe


def mem_available_mb():
    with open("/proc/meminfo") as f:
        for line in f:
            if line.startswith("MemAvailable:"):
                return int(line.split()[1]) // 1024
    return 1 << 30


def gpu_temp_c():
    try:
        import subprocess

        out = subprocess.run(
            ["nvidia-smi", "--query-gpu=temperature.gpu", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=10,
        ).stdout.strip()
        return int(out.splitlines()[0])
    except Exception:
        return 0


def safety_wait():
    """Machine-safety guard (laptop shared with renders): wait for RAM and GPU temp."""
    while (avail := mem_available_mb()) < 2000:
        print(f"[safety] MemAvailable {avail} MB < 2000, waiting 15s", flush=True)
        time.sleep(15)
    while (t := gpu_temp_c()) > 85:
        print(f"[safety] GPU {t} C > 85, pausing 60s", flush=True)
        time.sleep(60)


def main():
    import gc

    jobs = json.load(open(sys.argv[1]))
    safety_wait()
    pipe = load()
    for job in jobs:
        os.makedirs(job["outdir"], exist_ok=True)
        for seed in job["seeds"]:
            gc.collect()
            torch.cuda.empty_cache()
            safety_wait()
            t0 = time.time()
            gen = torch.Generator("cpu").manual_seed(int(seed))
            img = pipe(
                prompt=job["prompt"],
                negative_prompt=job.get("negative", NEGATIVE),
                width=job["width"],
                height=job["height"],
                num_inference_steps=job.get("steps", 6),
                guidance_scale=job.get("cfg", 1.8),
                generator=gen,
            ).images[0]
            base = os.path.join(job["outdir"], f"{job['name']}_s{seed}")
            img.save(base + ".png")
            prev = img.copy()
            prev.thumbnail((640, 640))
            prev.save(base + "_prev.jpg", quality=88)
            print(f"[gen] {job['name']} seed={seed} {time.time() - t0:.1f}s -> {base}.png", flush=True)
    del pipe
    torch.cuda.empty_cache()


if __name__ == "__main__":
    main()
