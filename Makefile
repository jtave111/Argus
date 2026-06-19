.PHONY: server clean

# Compila e sobe o servidor Java
server:
	cd argus-server && ./gradlew bootRun

# Build sem rodar
build:
	cd argus-server && ./gradlew build

# Remove artefatos de build
clean:
	cd argus-server && ./gradlew clean
