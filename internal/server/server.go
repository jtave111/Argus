package server

import (
	"database/sql"
	"net"
	"sync"

	"github.com/jtave111/argus/internal/db"
	"github.com/jtave111/argus/proto"
	"google.golang.org/grpc"
)

var _ = sql.Open
var _ = net.Listen
var _ sync.Map
var _ = db.New
var _ = proto.RegisterAgentServiceServer
var _ = grpc.NewServer

// Server é o hub central — gerencia agentes conectados e expõe a API.
type Server struct {
	// TODO: addr string
	// TODO: agents map[string]*ConnectedAgent
	// TODO: db   *sql.DB
}

// New cria uma instância do servidor.
func New() *Server {
	return &Server{}
}

// Start sobe o servidor gRPC e o servidor HTTP.
func (s *Server) Start() error {
	// TODO: iniciar listener gRPC
	// TODO: iniciar HTTP server (API REST + WebSocket)
	return nil
}
