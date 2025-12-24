FROM python:3.11-slim

# Workdir
WORKDIR /app

# System deps (build + Postgres, etc. as needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Environment
ENV FLASK_APP=run.py \
    FLASK_ENV=production

# Expose Flask port
EXPOSE 5000

# Run the app with gunicorn (better than built-in server)
CMD ["gunicorn", "-b", "0.0.0.0:5000", "run:app"]
