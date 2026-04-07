# Node/npm must exist in this stage (features run after Dockerfile build).
# typescript-node: Node LTS + global TypeScript (tsc); claude-code is an extra cached layer.
FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# node 유저(UID 1000)를 vscode로 리네임하여 workspaceFolder(/home/vscode)와 경로 통일
RUN usermod -l vscode -d /home/vscode -m node \
    && groupmod -n vscode node \
    && find /etc/sudoers.d -type f -exec sed -i 's/\bnode\b/vscode/g' {} + 2>/dev/null || true

RUN npm install -g @anthropic-ai/claude-code
