FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm

# Install Python 3.11 for Django backends
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm 10
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Install global tools
RUN npm install -g tsx turbo@latest

# Set up Python virtual environment
RUN python3.11 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python linting tools
RUN pip install --no-cache-dir ruff mypy pydantic

WORKDIR /workspace
