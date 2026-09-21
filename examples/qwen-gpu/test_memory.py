import ast,json,sys,types,unittest
from unittest.mock import MagicMock,patch
from pathlib import Path
class MemoryTests(unittest.TestCase):
 def test_t4_generation(self):
  torch=MagicMock();torch.cuda.is_available.return_value=True;torch.cuda.is_bf16_supported.return_value=False
  torch.cuda.OutOfMemoryError=type('OOM',(Exception,),{})
  pipeline=MagicMock();pipe=MagicMock();pipeline.from_pretrained.return_value=pipe
  with patch.dict(sys.modules,{'torch':torch,'diffusers':types.SimpleNamespace(QwenImage21Pipeline=pipeline)}):
   scope={};exec(compile(Path(__file__).with_name('inference.py').read_text(), 'inference.py','exec'),scope)
   result=scope['load_pipeline']('sequential');pipe.enable_sequential_cpu_offload.assert_called_once();pipe.to.assert_not_called();pipe.vae.enable_tiling.assert_called_once()
   scope['generate'](result,'dragon');args=pipe.call_args.kwargs
   self.assertEqual(args['width'],512);self.assertEqual(args['output_resolution'],512);self.assertFalse(args['use_kv_cache'])
   pipe.side_effect=torch.cuda.OutOfMemoryError()
   with self.assertRaisesRegex(RuntimeError,'384'):scope['generate'](result,'dragon')
 def test_notebook_syntax(self):
  notebook=json.loads((Path(__file__).parents[2]/'public/notebooks/qwen-image-2.1.ipynb').read_text(encoding='utf-8'))
  for cell in notebook['cells']:
   if cell['cell_type']=='code':ast.parse(''.join(line for line in cell['source'] if not line.lstrip().startswith(('%','!'))))
if __name__=='__main__':unittest.main()
