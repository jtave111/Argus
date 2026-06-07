package server

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
