package agent

import (
	"github.com/jtave111/argus/proto"
	"google.golang.org/grpc"
)

// Agent mantém conexão persistente com o servidor central
// e executa comandos recebidos via gRPC.
type Agent struct {
	serverAddr string
	token      string
	conn       *grpc.ClientConn
	stream     proto.AgentService_ConnectClient

	// TODO: serverAddr string
	// TODO: token      string
	// TODO: conn       *grpc.ClientConn
}

// New cria uma instância do agente.
func New(serverAddr, token string) *Agent {
	return &Agent{
		serverAddr: serverAddr,
		token:      token,
	}
}

// Connect estabelece a conexão gRPC com o servidor.
func (a *Agent) Connect() error {
	// TODO: grpc.Dial com TLS
	// TODO: iniciar stream bidirecional

	return nil

}

// Run mantém o agente rodando e processa comandos.
func (a *Agent) Run() error {
	// TODO: loop de recebimento de comandos
	// TODO: reconectar se perder conexão
	return nil
}
