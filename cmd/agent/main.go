package main

import "fmt"

func main() {
	fmt.Println("Argus agent starting...")
	// TODO: ler flags: --server, --token
	// TODO: conectar ao servidor central via gRPC (TLS)
	// TODO: manter conexão persistente + reconectar se cair
}
