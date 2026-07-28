rootProject.name = "argus"

// Monorepo Gradle dos componentes Java (um settings, um ./gradlew para os dois).
include("server")    // backend Spring Boot + gRPC — o ÚNICO componente exposto na rede
include("desktop")   // host JavaFX (o "main"): lança e serve o renderer React em 127.0.0.1
// desktop/renderer (React/TS) tem build próprio (npm/vite) e é EMPACOTADO pelo desktop —
// nunca exposto na rede. agents/ (nativos, 1 por SO) não são módulos Gradle.
