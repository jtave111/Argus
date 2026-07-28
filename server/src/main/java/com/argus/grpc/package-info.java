/**
 * Camada gRPC: implementações {@code @GrpcService} do contrato {@code argus.proto}.
 * É aqui que vive o stream bidirecional {@code AgentService.Connect} — recebe
 * telemetria dos agentes e envia comandos. Deve delegar a lógica para {@code service}.
 */
package com.argus.grpc;
