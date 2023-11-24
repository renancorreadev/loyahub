package main

import (
	"context"
	"log"
	config "service/config/initializers"
)

func main() {
    log.Println("Starting block monitor...")

    // Inicializar o processador de eventos de registro de cliente
    _, err := config.InitializeClientEventProcessor()
    if err != nil {
        log.Fatalf("Erro ao inicializar o processador de eventos Client: %v", err)
    }

    <-context.Background().Done()
}
