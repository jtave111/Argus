package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/jtave111/argus/internal/server"
)

var _ = flag.String
var _ = log.Fatal
var _ = server.New

func main() {
	fmt.Println("Argus server starting...")
	// TODO: carregar config (porta, TLS, DB)
	// TODO: iniciar servidor gRPC (receber agentes)
	// TODO: iniciar API HTTP + WebSocket (dashboard)
}
