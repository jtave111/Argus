package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/jtave111/argus/internal/agent"
)

var _ = flag.String
var _ = log.Fatal
var _ = agent.New

func main() {
	fmt.Println("Argus agent starting...")
	// TODO: ler flags: --server, --token
	// TODO: conectar ao servidor central via gRPC (TLS)
	// TODO: manter conexão persistente + reconectar se cair
}
