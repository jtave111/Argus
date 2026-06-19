import com.google.protobuf.gradle.id

plugins {
    java
    id("org.springframework.boot") version "3.3.5"
    id("io.spring.dependency-management") version "1.1.6"
    id("com.google.protobuf") version "0.9.4"
}

group = "com.argus"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

// Versões alinhadas com o starter gRPC do net.devh (3.1.0.RELEASE).
extra["grpcVersion"] = "1.64.0"
extra["protobufVersion"] = "3.25.5"

dependencies {
    // Web/WebSocket — futura API do dashboard SvelteKit.
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Camada de dados: JOOQ (você configura o codegen depois).
    implementation("org.springframework.boot:spring-boot-starter-jooq")
    runtimeOnly("org.postgresql:postgresql")

    // Migrations.
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // gRPC server (stream bidirecional AgentService) — você implementa o @GrpcService.
    implementation("net.devh:grpc-server-spring-boot-starter:3.1.0.RELEASE")
    implementation("io.grpc:grpc-stub:${property("grpcVersion")}")
    implementation("io.grpc:grpc-protobuf:${property("grpcVersion")}")
    implementation("com.google.protobuf:protobuf-java:${property("protobufVersion")}")
    // Necessário p/ as anotações @Generated do código gerado pelo grpc-java em JDK 9+.
    compileOnly("org.apache.tomcat:annotations-api:6.0.53")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

// O .proto na raiz do monorepo é a fonte única do contrato agente↔servidor.
sourceSets {
    main {
        proto {
            srcDir("../proto")
        }
    }
}

protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:${property("protobufVersion")}"
    }
    plugins {
        id("grpc") {
            artifact = "io.grpc:protoc-gen-grpc-java:${property("grpcVersion")}"
        }
    }
    generateProtoTasks {
        all().forEach {
            it.plugins {
                id("grpc")
            }
        }
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
