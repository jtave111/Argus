# argus-agent

Agentes nativos do Argus — **um por sistema operacional, sem código compartilhado**.
A única coisa em comum é o contrato gRPC em `../proto/argus.proto`; cada agente gera
seus próprios stubs e fala com o SO pela API nativa.

| Módulo | Stack | Integra com |
|--------|-------|-------------|
| `linux/`   | C++ + gRPC nativo   | systemd, /proc |
| `windows/` | .NET / C# + grpc-dotnet | Service Control Manager, WMI |
| `macos/`   | C++/Swift (planejado) | launchd |

Não reintroduzir uma camada de abstração cross-platform entre eles — a separação é
proposital. Cada pasta tem seu próprio build (CMake, dotnet, etc.).
