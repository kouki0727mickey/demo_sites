import io
import json
import runpy
from pathlib import Path
from contextlib import redirect_stdout
root=Path(__file__).resolve().parent
common=runpy.run_path(str(root/'common.py'))
globals_=runpy.run_path(str(root/'evals.py'),init_globals=common)
run=globals_['run_evals']; env=run.__globals__
env['getpass']=lambda *a:'not-a-real-key'
env['input']=lambda *a:'RUN'
env['gpu_info']=lambda *a:{'gpu':'CPU','python':'test'}
calls=[]
class Reply:
    status_code=200
    def json(self):return {'model':'test-jev','answers':{'does_pass':{'noul':.9},'quality':{'score':3}}}
class Transport:
    @staticmethod
    def post(url,**kwargs):
        assert kwargs['allow_redirects'] is False
        assert kwargs['timeout']==60
        assert json.loads(kwargs['json']['state'])['answer']=='A'
        calls.append(url)
        return Reply()
env['requests']=Transport
c=dict(schema='atlas-colab-config-v1',kind='evals',prompt='Q',evidence='E',answer='A',human_pass=True,repetitions=2,mode='generate',size=1024,steps=40,seed=42,transparent=False)
with redirect_stdout(io.StringIO()):result=run(c)
assert len(calls)==2 and len(result['rows'])==2
assert result['rows'][0]['score']==.75
assert 'not-a-real-key' not in json.dumps(result)
env['input']=lambda *a:'STOP'
try:
    with redirect_stdout(io.StringIO()):run(c)
except RuntimeError:pass
else:raise AssertionError('Should not call API without RUN')
assert len(calls)==2
print('Jev notebook request, normalization, secret exclusion and cancel tested with fake transport.')
