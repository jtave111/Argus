//go:build linux

package platform

import "os/exec"

// ServiceAction executa uma ação systemctl num serviço.
func ServiceAction(action, service string) error {
	// TODO: validar action (start/stop/restart/status)
	return exec.Command("systemctl", action, service).Run()
}

// ListServices lista todos os serviços systemd.
func ListServices() ([]string, error) {
	// TODO: parsear saída de `systemctl list-units --type=service`
	return nil, nil
}
