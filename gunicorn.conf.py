import os
import sys
import types
from importlib.abc import MetaPathFinder, Loader
from importlib.machinery import ModuleSpec

# Bind to Render's dynamic port (default 10000 on Render)
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"
workers = 1
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120

# Ensure root directory is on sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from backend.app.main import app as fastapi_app
except Exception as e:
    print(f"[gunicorn.conf.py] Error loading FastAPI app: {e}", file=sys.stderr)
    fastapi_app = None

class UniversalAppLoader(Loader):
    def create_module(self, spec):
        m = types.ModuleType(spec.name)
        m.__path__ = []
        return m

    def exec_module(self, module):
        module.application = fastapi_app
        module.app = fastapi_app

class UniversalAppFinder(MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        if any(keyword in fullname.lower() for keyword in ["wsgi", "application", "techinical", "technical"]):
            return ModuleSpec(fullname, UniversalAppLoader(), is_package=True)
        return None

sys.meta_path.insert(0, UniversalAppFinder())

# Also pre-populate sys.modules directly for known names
for mod_name in [
    "Techinical_implementation_specialist_application-2",
    "Techinical_implementation_specialist_application-2.wsgi",
    "Technical_implementation_Specialist_Assignment",
    "Technical_implementation_Specialist_Assignment.wsgi",
    "wsgi",
]:
    m = types.ModuleType(mod_name)
    m.__path__ = []
    m.application = fastapi_app
    m.app = fastapi_app
    sys.modules[mod_name] = m
