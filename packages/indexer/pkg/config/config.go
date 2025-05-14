package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

type Config struct {
	// Blockchain
	RPCURL string
	WSURL  string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	// RabbitMQ
	RabbitMQURL string

	// API REST
	APIPort string

	// Ajustes
	ConfirmationsRequired int
	BlocksPerBatch        int
	MaxWorkers            int
	LogLevel              string
}

var cfg *Config

func LoadConfig() *Config {
	if cfg != nil {
		return cfg
	}

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	err := godotenv.Load()
	if err != nil {
		logger.Warn("Arquivo .env não encontrado, usando variáveis de ambiente")
	}

	confirmationsRequired, _ := strconv.Atoi(getEnv("CONFIRMATIONS_REQUIRED", "12"))
	blocksPerBatch, _ := strconv.Atoi(getEnv("BLOCKS_PER_BATCH", "100"))
	maxWorkers, _ := strconv.Atoi(getEnv("MAX_WORKERS", "5"))

	cfg = &Config{
		// Blockchain
		RPCURL: getEnv("RPC_URL", "http://localhost:8545"),
		WSURL:  getEnv("WS_URL", "ws://localhost:8546"),

		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "indexer"),

		// RabbitMQ
		RabbitMQURL: getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),

		// API REST
		APIPort: getEnv("API_PORT", "8080"),

		// Ajustes
		ConfirmationsRequired: confirmationsRequired,
		BlocksPerBatch:        blocksPerBatch,
		MaxWorkers:            maxWorkers,
		LogLevel:              getEnv("LOG_LEVEL", "info"),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func Get() *Config {
	if cfg == nil {
		return LoadConfig()
	}
	return cfg
}
