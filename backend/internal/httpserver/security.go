package httpserver

import (
	"net"
	"net/http"
	"sync"
	"time"
)

func setSecurityHeaders(w http.ResponseWriter, tls bool) {
	w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; frame-src 'none'")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()")
	w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
	w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
	if tls {
		w.Header().Set("Strict-Transport-Security", "max-age=31536000")
	}
}

type rateEntry struct {
	tokens  float64
	updated time.Time
}
type rateLimiter struct {
	mu      sync.Mutex
	clients map[string]rateEntry
	burst   float64
	refill  float64
}

func newRateLimiter(burst, refill float64) *rateLimiter {
	return &rateLimiter{clients: make(map[string]rateEntry), burst: burst, refill: refill}
}

func (l *rateLimiter) allow(address string) bool {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		host = address
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	entry, found := l.clients[host]
	if !found {
		if len(l.clients) >= 4096 {
			for key, value := range l.clients {
				if now.Sub(value.updated) > time.Minute {
					delete(l.clients, key)
				}
			}
			if len(l.clients) >= 4096 {
				return false
			}
		}
		entry = rateEntry{tokens: l.burst, updated: now}
	}
	entry.tokens += now.Sub(entry.updated).Seconds() * l.refill
	if entry.tokens > l.burst {
		entry.tokens = l.burst
	}
	entry.updated = now
	allowed := entry.tokens >= 1
	if allowed {
		entry.tokens--
	}
	l.clients[host] = entry
	return allowed
}
