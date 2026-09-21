import torch
from PIL import Image
from huggingface_hub import hf_hub_download
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoProcessor, AutoModelForImageTextToText

def run_rewrite(c):
    env = gpu_info()
    if not torch.cuda.is_available(): raise RuntimeError('CUDA GPUを選択してください。')
    model_id = 'Qwen/Qwen-Image-2.1-PE-' + ('I2I' if c['mode']=='edit' else 'T2I')
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    system = Path(hf_hub_download(model_id, 'system_prompt.txt')).read_text()
    prompt = effective_prompt(c)
    if c['mode'] == 'edit':
        refs = [image.convert('RGB') for image in upload_images()]
        processor = AutoProcessor.from_pretrained(model_id)
        model = AutoModelForImageTextToText.from_pretrained(model_id, dtype=dtype, device_map='auto').eval()
        messages = [{'role':'system','content':[{'type':'text','text':system}]}, {'role':'user','content':[{'type':'image','image':image} for image in refs]+[{'type':'text','text':prompt}]}]
        inputs = processor.apply_chat_template(messages, add_generation_prompt=True, tokenize=True, return_dict=True, return_tensors='pt', enable_thinking=True).to(model.device)
        tokenizer = processor.tokenizer
    else:
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = AutoModelForCausalLM.from_pretrained(model_id, dtype=dtype, device_map='auto').eval()
        text = tokenizer.apply_chat_template([{'role':'system','content':system},{'role':'user','content':prompt}], tokenize=False, add_generation_prompt=True, enable_thinking=True)
        inputs = tokenizer(text, return_tensors='pt').to(model.device)
    torch.manual_seed(c['seed'])
    torch.cuda.synchronize(); start = time.perf_counter()
    with torch.inference_mode():
        output = model.generate(**inputs, max_new_tokens=24000 if c['mode']=='edit' else 16256, do_sample=True, temperature=1.0, top_p=.95, top_k=20)
    torch.cuda.synchronize(); elapsed = time.perf_counter()-start
    decoded = tokenizer.decode(output[0, inputs['input_ids'].shape[1]:], skip_special_tokens=True)
    answer = decoded.rsplit('</think>',1)[-1].strip()
    if answer.startswith('```'):
        answer = '\n'.join(answer.splitlines()[1:-1])
    result = json.loads(answer)
    if not isinstance(result.get('rewritten_prompt'),str) or not result['rewritten_prompt'].strip():
        raise ValueError('モデルが有効な書き換え文を返しませんでした。')
    print(result['rewritten_prompt'])
    env.update(transformers=__import__('transformers').__version__, torch=torch.__version__, dtype=str(dtype))
    return report(c, 'qwen-pe', model_id, elapsed, env, rewrite=result, timing_scope='generation_only', system_prompt_sha256=hashlib.sha256(system.encode()).hexdigest())
