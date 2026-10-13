package httpserver

import (
	"net/http"
	"net/url"
	"os"
	"strings"
)

type Config struct {
	ContentDir string
	WebDir     string
	DevOrigin  string
}

type Handler struct {
	content   *os.Root
	web       *os.Root
	devOrigin string
	limiter   *rateLimiter
}

func New(config Config) (*Handler, error) {
	content, err := os.OpenRoot(config.ContentDir)
	if err != nil {
		return nil, err
	}
	h := &Handler{content: content, devOrigin: config.DevOrigin, limiter: newRateLimiter(60, 3)}
	if config.WebDir != "" {
		h.web, err = os.OpenRoot(config.WebDir)
		if err != nil {
			content.Close()
			return nil, err
		}
	}
	return h, nil
}

func (h *Handler) Close() {
	h.content.Close()
	if h.web != nil {
		h.web.Close()
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	setSecurityHeaders(w, r.TLS != nil)
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if strings.HasPrefix(r.URL.Path, "/api/") {
		w.Header().Set("Cache-Control", "no-store")
		if !h.sameOrigin(r) {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		if !h.limiter.allow(r.RemoteAddr) {
			w.Header().Set("Retry-After", "60")
			http.Error(w, "Too many requests", http.StatusTooManyRequests)
			return
		}
		switch {
		case r.URL.Path == "/api/health":
			writeJSON(w, r, map[string]string{"status": "ok"})
		case r.URL.Path == "/api/files":
			h.listFiles(w, r)
		case strings.HasPrefix(r.URL.Path, "/api/content/"):
			h.serveContent(w, r)
		default:
			http.NotFound(w, r)
		}
		return
	}
	h.serveWeb(w, r)
}

func (h *Handler) sameOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if r.Header.Get("Sec-Fetch-Site") == "cross-site" {
		return false
	}
	if origin == "" {
		return true
	}
	if h.devOrigin != "" && origin == h.devOrigin {
		return true
	}
	parsed, err := url.Parse(origin)
	return err == nil && parsed.User == nil && (parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Host == r.Host && parsed.Path == "" && parsed.RawQuery == "" && parsed.Fragment == ""
}
