import org.gradle.internal.os.OperatingSystem

plugins {
    java
    application
    id("org.openjfx.javafxplugin") version "0.1.0"
    id("org.beryx.runtime") version "1.13.1"   // jlink + jpackage escaláveis (não-modular)
}

group = "com.argus"
version = "0.1.0"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(21) }
}

repositories { mavenCentral() }

javafx {
    version = "21.0.5"
    modules = listOf("javafx.controls", "javafx.web", "javafx.swing")
}

application {
    mainClass = "com.argus.desktop.DesktopMain"
}

/* --------------------------------------------------------------------------
   Build do renderer React (desktop/renderer) → empacotado nos recursos do desktop.
   `./gradlew :desktop:run` roda o build do renderer se necessário e abre a janela.
   -------------------------------------------------------------------------- */

val webDir = file("renderer")
val webDist = file("renderer/dist")
val npmCmd = if (OperatingSystem.current().isWindows) "npm.cmd" else "npm"

val npmInstall by tasks.registering(Exec::class) {
    workingDir = webDir
    commandLine(npmCmd, "install", "--no-audit", "--no-fund")
    inputs.file("renderer/package.json")
    outputs.dir("renderer/node_modules")
}

val webBuild by tasks.registering(Exec::class) {
    dependsOn(npmInstall)
    workingDir = webDir
    commandLine(npmCmd, "run", "build")
    inputs.dir("renderer/src")
    inputs.file("renderer/index.html")
    outputs.dir(webDist)
}

// Copia o dist do web para os recursos do jar (servidos pelo servidor local embutido).
val copyWeb by tasks.registering(Copy::class) {
    dependsOn(webBuild)
    from(webDist)
    into(layout.buildDirectory.dir("resources/main/web"))
}

tasks.named("processResources") { dependsOn(copyWeb) }
tasks.named<JavaExec>("run") {
    // renderização de fontes mais suave
    jvmArgs("-Dprism.lcdtext=false")
}

/* --------------------------------------------------------------------------
   Empacotamento nativo ESCALÁVEL (org.beryx.runtime): jlink cria uma JVM mínima
   e o jpackage embute app + JavaFX + JVM num instalador. O plugin descobre jars,
   deps e versão sozinho — independe de renomear/versionar/mexer no projeto.

     ./gradlew :desktop:jpackageImage  → app-image (base p/ AppImage no Linux)
     ./gradlew :desktop:jpackage       → instalador nativo (.exe/.msi, .dmg, .deb)

   O empacotamento sempre reconstrói o web antes (jpackage depende de processResources).
   -------------------------------------------------------------------------- */
runtime {
    options.set(listOf("--strip-debug", "--compress", "2", "--no-header-files", "--no-man-pages"))
    // Módulos do JDK que o app usa (LocalWebServer usa jdk.httpserver; JavaFX web usa os demais).
    modules.set(listOf(
        "java.base", "java.desktop", "java.logging", "java.naming", "java.scripting",
        "java.sql", "java.xml", "jdk.httpserver", "jdk.unsupported", "jdk.jsobject", "jdk.xml.dom"
    ))

    jpackage {
        imageName = "Argus"
        installerName = "Argus"
        jvmArgs = listOf("-Dprism.lcdtext=false")
        val os = OperatingSystem.current()
        installerType = when {
            os.isWindows -> "exe"
            os.isMacOsX -> "dmg"
            else -> "deb"   // no Linux, `jpackageImage` gera o app-image (base p/ AppImage)
        }
    }
}
