.PHONY: server agent-linux agent-windows proto clean

# Compila o servidor central
server:
	go build -o bin/server ./cmd/server

# Compila o agente para Linux (amd64)
agent-linux:
	GOOS=linux GOARCH=amd64 go build -o bin/agent-linux ./cmd/agent

# Compila o agente para Linux (ARM64 — Raspberry Pi, servidores ARM)
agent-linux-arm:
	GOOS=linux GOARCH=arm64 go build -o bin/agent-linux-arm ./cmd/agent

# Compila o agente para Windows
agent-windows:
	GOOS=windows GOARCH=amd64 go build -o bin/agent.exe ./cmd/agent

# Gera código Go a partir dos .proto
proto:
	protoc --go_out=paths=source_relative:. --go-grpc_out=paths=source_relative:. proto/argus.proto

# Remove binários compilados
clean:
	rm -rf bin/
