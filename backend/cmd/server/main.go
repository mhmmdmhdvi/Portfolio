package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"windows11/portfolio/internal/httpserver"
)

func env(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func main() {
	development := flag.Bool("dev", false, "Run the local development API")
	flag.Parse()
	webDir := env("WEB_DIR", "../frontend/dist")
	devOrigin := os.Getenv("DEV_ORIGIN")
	if *development {
		devOrigin = "http://127.0.0.1:5173"
	}
	if devOrigin != "" {
		webDir = ""
	}
	handler, err := httpserver.New(httpserver.Config{ContentDir: env("CONTENT_DIR", "content"), WebDir: webDir, DevOrigin: devOrigin})
	if err != nil {
		log.Fatal(err)
	}
	defer handler.Close()
	server := &http.Server{
		Addr: env("LISTEN_ADDR", "127.0.0.1:8080"), Handler: handler,
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second,
		WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second,
		MaxHeaderBytes: 16 << 10,
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Print(err)
		}
	}()
	log.Printf("Windows 11 server: http://%s", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
