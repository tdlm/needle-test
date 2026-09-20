FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    HF_HOME=/opt/needle-cache \
    NEEDLE_TELEMETRY=0 \
    DO_NOT_TRACK=1 \
    APP_PORT=8888

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && needle fetch \
    && needle download needle3

COPY app ./app
COPY client ./client

EXPOSE 8888

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${APP_PORT} --workers 1"]
