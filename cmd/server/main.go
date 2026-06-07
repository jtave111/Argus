package main

import "fmt"

func main() {
	fmt.Println("Argus server starting...")
	// TODO: carregar config (porta, TLS, DB)
	// TODO: iniciar servidor gRPC (receber agentes)
	// TODO: iniciar API HTTP + WebSocket (dashboard)
}
