import gc
import os
import torch
from diffusers import QwenImage21Pipeline


def load_pipeline(memory_mode=None):
    if not torch.cuda.is_available():
        raise RuntimeError('CUDA GPUが必要です。GPUランタイムを選択してください。')
    # Model offload moves whole components: the ~8B text encoder or DiT can
    # exhaust a T4 even though other components are held on the CPU.
    mode = memory_mode or os.environ.get('QWEN_MEMORY_MODE', 'cuda' if os.environ.get('QWEN_CPU_OFFLOAD') == '0' else 'model')
    if mode == 'auto':
        mode = 'sequential' if torch.cuda.get_device_properties(0).total_memory < 24 * 2**30 else 'model'
    if mode not in ('sequential', 'model', 'cuda'):
        raise ValueError('memory_modeはsequential / model / cuda / autoです。')
    gc.collect()
    torch.cuda.empty_cache()
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    pipe = QwenImage21Pipeline.from_pretrained(
        'Qwen/Qwen-Image-2.1', torch_dtype=dtype, low_cpu_mem_usage=True)
    # Qwen's RGBA VAE supports tiled decoding; slicing is not assumed supported.
    pipe.vae.enable_tiling()
    if mode == 'sequential':
        # Keep weights on CPU and move submodules only when they are needed.
        # Never call .to('cuda') before attaching these hooks.
        pipe.enable_sequential_cpu_offload()
    elif mode == 'model':
        pipe.enable_model_cpu_offload()
    else:
        pipe.to('cuda')
    pipe._atlas_low_memory = mode == 'sequential'
    print('Memory mode:', mode, '/ VAE tiling: on / dtype:', dtype)
    return pipe


def generate(pipe, prompt, size=512, seed=42, steps=40, images=None):
    if not isinstance(size, int) or size < 256 or size > 2048 or size % 32:
        raise ValueError('サイズは256〜2048、32の倍数を指定してください。')
    low_memory = getattr(pipe, '_atlas_low_memory', False)
    if low_memory and size > 768:
        raise ValueError('省メモリモードは768px以下にしてください。T4ではまず512pxで実行します。')
    if low_memory and images and len(images) > 1:
        raise ValueError('省メモリモードの参照画像は1枚にしてください。')
    kwargs = dict(prompt=prompt, width=size, height=size, output_resolution=size,
                  num_inference_steps=steps, true_cfg_scale=1.0,
                  use_kv_cache=not low_memory,
                  generator=torch.Generator('cpu').manual_seed(seed))
    if images:
        kwargs['image'] = images
    gc.collect()
    torch.cuda.empty_cache()
    try:
        with torch.inference_mode():
            return pipe(**kwargs).images[0]
    except torch.cuda.OutOfMemoryError:
        # No automatic retry: keep size/seed and model changes explicit to users.
        pipe.maybe_free_model_hooks()
        gc.collect()
        torch.cuda.empty_cache()
        raise RuntimeError(
            'T4のGPUメモリが不足しました。ランタイムを再起動し、sequentialでモデルを1つだけ読み込み、'
            'size=384（さらに不足する場合は256）、参照画像なしで再実行してください。'
            '通常RAMの不足や別モデルのGPU使用も確認してください。') from None
