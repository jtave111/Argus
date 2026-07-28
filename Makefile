.PHONY: server desktop build clean

# Sobe o backend (Spring Boot + gRPC)
server:
	./gradlew :server:bootRun

# Abre o app desktop (builda o renderer se necessário e abre a janela)
desktop:
	./gradlew :desktop:run

# Build de todo o monorepo Java (server + desktop; o desktop empacota o renderer)
build:
	./gradlew build

# Remove artefatos de build
clean:
	./gradlew clean
