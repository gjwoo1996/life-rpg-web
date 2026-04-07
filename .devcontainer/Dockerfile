# Node/npm must exist in this stage (features run after Dockerfile build).
# typescript-node: Node LTS + global TypeScript (tsc); claude-code is an extra cached layer.
FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

RUN npm install -g @anthropic-ai/claude-code

# Named volume이 빈 상태로 처음 생성될 때 Docker가 이 디렉토리 권한을 복사함.
# node 유저(uid=1000)가 Claude Code 설정/인증 파일을 쓸 수 있도록 미리 소유권 설정.
RUN mkdir -p /home/node/.claude && chown -R node:node /home/node/.claude
