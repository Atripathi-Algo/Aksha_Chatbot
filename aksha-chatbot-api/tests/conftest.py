import sys
from pathlib import Path

# So `import app.xxx` / `import llm_client` work regardless of the
# directory pytest is invoked from — mirrors the sys.path.insert(0, ".")
# convention the existing plain-script tests use, centralized once here.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
