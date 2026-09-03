# aksha-chatbot-api — FastAPI + LangGraph service.
# llm_client.py sits at the repo root alongside app/, so the working
# directory (not a package path) is what main.py's `from llm_client import
# LLMClient` resolves against — keep WORKDIR as the import root.

FROM python:3.11-slim

WORKDIR /srv

# Install dependencies first so this layer is cached across code-only changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

EXPOSE 8010

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8010/v1/health/ready', timeout=3)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8010"]
