# Empacotamento — do código ao instalador nativo

O Argus Desktop é um app **JavaFX WebView** que serve o frontend React (`desktop/renderer`) de um
servidor local em `127.0.0.1` (sem URL exposta). Este guia mostra como transformar tudo
num executável/instalador único por SO.

## Cadeia de build (um comando)

```
./gradlew build          # raiz: builda server + desktop
                         # desktop, via tasks Gradle, roda `npm install`+`npm run build`
                         # do desktop/renderer e copia o dist/ para os recursos do jar
```

- Quem builda o front é o **desktop** (não o server). O React vira estático embutido.
- `./gradlew :desktop:run` abre a janela nativa (buildando o web se preciso).

## Instalador nativo (escalável via `org.beryx.runtime`)

O empacotamento usa o plugin **`org.beryx.runtime`**: ele roda `jlink` (JVM mínima só com
os módulos usados) e `jpackage` (embute app + JavaFX + JVM). O plugin **descobre jars, deps
e versão sozinho** — renomear, versionar ou modificar o projeto **não quebra** o
empacotamento. Sempre reconstrói o web antes (depende de `processResources`).

Pré-requisito: **JDK 21** (traz `jlink`/`jpackage`). Para instaladores Linux, `dpkg`/
`fakeroot` (.deb) ou `rpmbuild` (.rpm); o **app-image não precisa de nada extra**.

```bash
./gradlew :desktop:jpackageImage   # app-image (pasta executável) — base p/ AppImage
./gradlew :desktop:jpackage        # instalador nativo (.deb/.exe/.dmg conforme o SO)
```

| Tarefa | Linux | Windows | macOS |
|--------|-------|---------|-------|
| `jpackageImage` | `build/jpackage/Argus/` (app-image) | idem | idem |
| `jpackage`      | `.deb` | `.exe` | `.dmg` |

O artefato embute a JVM — o usuário final **não precisa ter Java**. O frontend React já vem
dentro do jar (`web/`), servido pelo host em `127.0.0.1`. (Verificado: app-image de ~111 MB
com `jdk.httpserver` na JVM custom e o `dist` embutido.)

### Gerar AppImage (Linux)

`jpackageImage` produz `build/jpackage/Argus/` (app-image). Para um **.AppImage**:

```bash
./gradlew :desktop:jpackageImage
appimagetool desktop/build/jpackage/Argus Argus-x86_64.AppImage
```

Prefere `.deb`? Já é o `installerType` no Linux — rode `:desktop:jpackage`.

## Notas

- **Cross-compile não:** `jpackage` gera o instalador **do SO em que roda**. Para ter
  `.exe` + `.dmg` + `.AppImage`, rode em cada SO (idealmente no CI — uma matriz Linux/
  Windows/macOS).
- **Ícones:** adicionar `--icon` na task `packageApp` (`.png` no Linux, `.ico` no Windows,
  `.icns` no macOS) quando houver o logo do Argus em arquivo.
- **Assinatura:** Windows (`--win-*` + signtool) e macOS (notarização) para distribuição
  externa; opcional para uso interno.
- **Verificação:** este ambiente não tem display gráfico nem `jpackage` testado end-to-end,
  então a task está configurada mas o artefato final deve ser validado na máquina de build.
