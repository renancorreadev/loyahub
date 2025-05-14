package api

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/loyahub/indexer/pkg/config"
	"github.com/loyahub/indexer/pkg/db"
)

var (
	logger *zap.Logger
	router *gin.Engine
	server *http.Server
)

// SetupRouter configura o router Gin com as rotas
func SetupRouter(pool *pgxpool.Pool) *gin.Engine {
	logger, _ = zap.NewProduction()
	defer logger.Sync()

	// Configura modo do Gin
	if config.Get().LogLevel == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	router = gin.New()
	router.Use(gin.Recovery())
	router.Use(loggerMiddleware())
	router.Use(corsMiddleware())

	// Rota de saúde
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// Rotas da API
	v1 := router.Group("/api/v1")
	{
		// Tokens
		tokens := v1.Group("/tokens")
		{
			tokens.GET("", listTokens)
			tokens.GET("/:address", getToken)
			tokens.POST("", addToken)
		}

		// Transferências
		transfers := v1.Group("/transfers")
		{
			transfers.GET("", listTransfers)
			transfers.GET("/:id", getTransfer)
		}

		// Aprovações
		approvals := v1.Group("/approvals")
		{
			approvals.GET("", listApprovals)
			approvals.GET("/:id", getApproval)
		}

		// Saldos
		balances := v1.Group("/balances")
		{
			balances.GET("", listBalances)
			balances.GET("/:token/:owner", getBalance)
		}
	}

	return router
}

// StartServer inicia o servidor HTTP
func StartServer() error {
	if router == nil {
		logger.Error("Router não configurado. Execute SetupRouter primeiro")
		return fmt.Errorf("router não configurado")
	}

	cfg := config.Get()
	addr := ":" + cfg.APIPort

	server = &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	logger.Info("Iniciando servidor API REST", zap.String("port", cfg.APIPort))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("Falha ao iniciar servidor API REST", zap.Error(err))
		return err
	}

	return nil
}

// StopServer encerra o servidor graciosamente
func StopServer(ctx context.Context) error {
	if server == nil {
		return nil
	}

	logger.Info("Encerrando servidor API REST")
	return server.Shutdown(ctx)
}

// Middlewares

func loggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		if status >= 500 {
			logger.Error("API Request",
				zap.String("method", method),
				zap.String("path", path),
				zap.Int("status", status),
				zap.Duration("latency", latency),
				zap.String("ip", c.ClientIP()),
			)
		} else if status >= 400 {
			logger.Warn("API Request",
				zap.String("method", method),
				zap.String("path", path),
				zap.Int("status", status),
				zap.Duration("latency", latency),
				zap.String("ip", c.ClientIP()),
			)
		} else {
			logger.Info("API Request",
				zap.String("method", method),
				zap.String("path", path),
				zap.Int("status", status),
				zap.Duration("latency", latency),
				zap.String("ip", c.ClientIP()),
			)
		}
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Handlers

// listTokens lista todos os tokens ERC20 indexados
func listTokens(c *gin.Context) {
	pool := db.GetPool()
	if pool == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	limit := 10
	offset := 0

	if limitParam := c.Query("limit"); limitParam != "" {
		if val, err := strconv.Atoi(limitParam); err == nil && val > 0 {
			limit = val
		}
	}

	if offsetParam := c.Query("offset"); offsetParam != "" {
		if val, err := strconv.Atoi(offsetParam); err == nil && val >= 0 {
			offset = val
		}
	}

	rows, err := pool.Query(c, `
		SELECT address, name, symbol, decimals, total_supply, created_at, updated_at
		FROM tokens
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		logger.Error("Falha ao consultar tokens", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tokens"})
		return
	}
	defer rows.Close()

	tokens := []gin.H{}
	for rows.Next() {
		var address, name, symbol string
		var decimals int
		var totalSupply, createdAt, updatedAt string

		if err := rows.Scan(&address, &name, &symbol, &decimals, &totalSupply, &createdAt, &updatedAt); err != nil {
			logger.Error("Falha ao ler dados do token", zap.Error(err))
			continue
		}

		tokens = append(tokens, gin.H{
			"address":      address,
			"name":         name,
			"symbol":       symbol,
			"decimals":     decimals,
			"total_supply": totalSupply,
			"created_at":   createdAt,
			"updated_at":   updatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"tokens": tokens,
		"meta": gin.H{
			"limit":  limit,
			"offset": offset,
		},
	})
}

// getToken obtém informações de um token específico
func getToken(c *gin.Context) {
	pool := db.GetPool()
	if pool == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	address := c.Param("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Address is required"})
		return
	}

	var name, symbol string
	var decimals int
	var totalSupply, createdAt, updatedAt string

	err := pool.QueryRow(c, `
		SELECT name, symbol, decimals, total_supply, created_at, updated_at
		FROM tokens WHERE address = $1
	`, address).Scan(&name, &symbol, &decimals, &totalSupply, &createdAt, &updatedAt)

	if err != nil {
		logger.Error("Falha ao consultar token", zap.String("address", address), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Token not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"address":      address,
		"name":         name,
		"symbol":       symbol,
		"decimals":     decimals,
		"total_supply": totalSupply,
		"created_at":   createdAt,
		"updated_at":   updatedAt,
	})
}

// addToken adiciona um novo token para ser indexado
func addToken(c *gin.Context) {
	pool := db.GetPool()
	if pool == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	var token struct {
		Address string `json:"address" binding:"required"`
	}

	if err := c.ShouldBindJSON(&token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verifica se já existe
	var exists bool
	err := pool.QueryRow(c, "SELECT EXISTS(SELECT 1 FROM tokens WHERE address = $1)", token.Address).Scan(&exists)
	if err != nil {
		logger.Error("Falha ao verificar token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Token already exists"})
		return
	}

	// Insere o token com valores vazios, serão preenchidos pelo indexador
	_, err = pool.Exec(c, `
		INSERT INTO tokens (address, name, symbol, decimals, total_supply)
		VALUES ($1, '', '', 0, '0')
	`, token.Address)

	if err != nil {
		logger.Error("Falha ao inserir token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Token added successfully",
		"address": token.Address,
	})
}

// listTransfers lista transferências com filtros
func listTransfers(c *gin.Context) {
	pool := db.GetPool()
	if pool == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	limit := 10
	offset := 0
	tokenAddress := c.Query("token")
	from := c.Query("from")
	to := c.Query("to")

	if limitParam := c.Query("limit"); limitParam != "" {
		if val, err := strconv.Atoi(limitParam); err == nil && val > 0 {
			limit = val
		}
	}

	if offsetParam := c.Query("offset"); offsetParam != "" {
		if val, err := strconv.Atoi(offsetParam); err == nil && val >= 0 {
			offset = val
		}
	}

	// Constrói a query com filtros
	query := `
		SELECT id, token_address, from_address, to_address, value, transaction_hash, 
			   block_number, block_hash, log_index, timestamp
		FROM transfers
		WHERE 1=1
	`
	args := []interface{}{}
	argNum := 1

	if tokenAddress != "" {
		query += fmt.Sprintf(" AND token_address = $%d", argNum)
		args = append(args, tokenAddress)
		argNum++
	}

	if from != "" {
		query += fmt.Sprintf(" AND from_address = $%d", argNum)
		args = append(args, from)
		argNum++
	}

	if to != "" {
		query += fmt.Sprintf(" AND to_address = $%d", argNum)
		args = append(args, to)
		argNum++
	}

	query += " ORDER BY block_number DESC, log_index ASC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argNum, argNum+1)
	args = append(args, limit, offset)

	rows, err := pool.Query(c, query, args...)
	if err != nil {
		logger.Error("Falha ao consultar transferências", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transfers"})
		return
	}
	defer rows.Close()

	transfers := []gin.H{}
	for rows.Next() {
		var id, tokenAddress, fromAddress, toAddress, value, txHash, blockHash string
		var blockNumber, logIndex uint64
		var timestamp time.Time

		if err := rows.Scan(&id, &tokenAddress, &fromAddress, &toAddress, &value, &txHash,
			&blockNumber, &blockHash, &logIndex, &timestamp); err != nil {
			logger.Error("Falha ao ler dados da transferência", zap.Error(err))
			continue
		}

		transfers = append(transfers, gin.H{
			"id":               id,
			"token_address":    tokenAddress,
			"from":             fromAddress,
			"to":               toAddress,
			"value":            value,
			"transaction_hash": txHash,
			"block_number":     blockNumber,
			"block_hash":       blockHash,
			"log_index":        logIndex,
			"timestamp":        timestamp,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"transfers": transfers,
		"meta": gin.H{
			"limit":  limit,
			"offset": offset,
		},
	})
}

// getTransfer obtém uma transferência específica
func getTransfer(c *gin.Context) {
	pool := db.GetPool()
	if pool == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
		return
	}

	var tokenAddress, fromAddress, toAddress, value, txHash, blockHash string
	var blockNumber, logIndex uint64
	var timestamp time.Time

	err := pool.QueryRow(c, `
		SELECT token_address, from_address, to_address, value, transaction_hash, 
			   block_number, block_hash, log_index, timestamp
		FROM transfers WHERE id = $1
	`, id).Scan(&tokenAddress, &fromAddress, &toAddress, &value, &txHash,
		&blockNumber, &blockHash, &logIndex, &timestamp)

	if err != nil {
		logger.Error("Falha ao consultar transferência", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Transfer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":               id,
		"token_address":    tokenAddress,
		"from":             fromAddress,
		"to":               toAddress,
		"value":            value,
		"transaction_hash": txHash,
		"block_number":     blockNumber,
		"block_hash":       blockHash,
		"log_index":        logIndex,
		"timestamp":        timestamp,
	})
}

// listApprovals lista aprovações com filtros
func listApprovals(c *gin.Context) {
	// Implementação similar à listTransfers
	c.JSON(http.StatusOK, gin.H{"message": "Not implemented yet"})
}

// getApproval obtém uma aprovação específica
func getApproval(c *gin.Context) {
	// Implementação similar à getTransfer
	c.JSON(http.StatusOK, gin.H{"message": "Not implemented yet"})
}

// listBalances lista saldos com filtros
func listBalances(c *gin.Context) {
	// Implementação similar à listTransfers
	c.JSON(http.StatusOK, gin.H{"message": "Not implemented yet"})
}

// getBalance obtém o saldo de um endereço para um token
func getBalance(c *gin.Context) {
	pool := db.GetPool()
	if pool == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	tokenAddress := c.Param("token")
	owner := c.Param("owner")

	if tokenAddress == "" || owner == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token address and owner are required"})
		return
	}

	var value, updatedAt string

	err := pool.QueryRow(c, `
		SELECT value, updated_at
		FROM balances WHERE token_address = $1 AND owner = $2
	`, tokenAddress, owner).Scan(&value, &updatedAt)

	if err != nil {
		logger.Error("Falha ao consultar saldo",
			zap.String("token", tokenAddress),
			zap.String("owner", owner),
			zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Balance not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token_address": tokenAddress,
		"owner":         owner,
		"value":         value,
		"updated_at":    updatedAt,
	})
}
