FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN python - <<'PY'
from pathlib import Path

source = Path("requirements.txt")
target = Path("docker_requirements.txt")

fixed_lines = []

for line in source.read_text(encoding="utf-8").splitlines():
    clean = line.strip().lower()

    if clean.startswith("numpy==2.") or clean.startswith("numpy>=2") or clean == "numpy":
        fixed_lines.append("numpy==1.26.4")
    else:
        fixed_lines.append(line)

target.write_text("\n".join(fixed_lines) + "\n", encoding="utf-8")

print("Docker requirements generated:")
print(target.read_text(encoding="utf-8"))
PY

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r docker_requirements.txt

COPY . .

EXPOSE 8001

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]