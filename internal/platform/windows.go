//go:build windows

package platform

import "os/exec"

// ServiceAction executa uma ação num serviço Windows via sc.exe.
func ServiceAction(action, service string) error {
	// TODO: mapear actions (start/stop/restart) para comandos sc.exe
	return exec.Command("sc", action, service).Run()
}

// ListServices lista todos os serviços Windows.
func ListServices() ([]string, error) {
	// TODO: parsear saída de `sc query type= all`
	return nil, nil
}
