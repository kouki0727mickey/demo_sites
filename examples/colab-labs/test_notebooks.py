import ast
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from common import validate_config
root=Path(__file__).resolve().parents[2]
for path in (root/'public/notebooks').glob('atlas-*.ipynb'):
    notebook=json.loads(path.read_text(encoding='utf-8'))
    assert notebook['nbformat']==4
    for cell in notebook['cells']:
        if cell['cell_type']=='code':
            assert cell['outputs']==[] and cell['execution_count'] is None
            source=''.join(cell['source'])
            ast.parse('\n'.join(line for line in source.splitlines() if not line.startswith('%')))
    assert 'save_report(result)' in path.read_text(encoding='utf-8')
    print('Notebook syntax OK:',path.name)
config=dict(schema='atlas-colab-config-v1',kind='comfyui',prompt='test',seed=42,size=1024,steps=40,repetitions=2,mode='generate',transparent=True)
assert validate_config(config,'comfyui')==config
for changes in [dict(kind='evals'),dict(steps=0),dict(seed=-1),dict(mode='bad'),dict(transparent='yes')]:
    try:validate_config({**config,**changes},'comfyui')
    except ValueError:pass
    else:raise AssertionError('Invalid config accepted')
print('Config validation passed. GPU/API execution not performed.')
