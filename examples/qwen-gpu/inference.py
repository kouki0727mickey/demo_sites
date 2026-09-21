import os
import torch
from diffusers import QwenImage21Pipeline


def load_pipeline():
    if not torch.cuda.is_available():
        raise RuntimeError('CUDA GPUが必要です。GPUランタイムを選択してください。')
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    pipe = QwenImage21Pipeline.from_pretrained('Qwen/Qwen-Image-2.1', torch_dtype=dtype)
    if os.environ.get('QWEN_CPU_OFFLOAD', '1') == '1':
        pipe.enable_model_cpu_offload()
    else:
        pipe.to('cuda')
    return pipe


def generate(pipe, prompt, size=1024, seed=42, steps=40, images=None):
    kwargs = dict(prompt=prompt, width=size, height=size, num_inference_steps=steps,
                  generator=torch.Generator('cuda').manual_seed(seed))
    if images:
        kwargs['image'] = images
    with torch.inference_mode():
        return pipe(**kwargs).images[0]
