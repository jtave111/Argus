/**
 * Regras de negócio da aplicação. Inclui o <em>hub</em> de agentes — o registro
 * em memória das conexões gRPC ativas, responsável por rotear comandos do servidor
 * para o agente certo. Orquestra {@code persistence} e é chamado por {@code grpc}/{@code web}.
 */
package com.argus.service;
