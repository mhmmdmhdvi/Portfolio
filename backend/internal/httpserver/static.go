package httpserver

import (
	"mime"
	"net/http"
	"path"
	"strconv"
	"strings"
)

func (h *Handler) serveWeb(w http.ResponseWriter, r *http.Request) {
	if h.web == nil {
		http.NotFound(w, r)
		return
	}
	name := strings.TrimPrefix(r.URL.Path, "/")
	if name == "" {
		name = "index.html"
	}
	if !safePath(name) {
		http.NotFound(w, r)
		return
	}
	file, err := h.web.Open(name)
	if err != nil {
		if path.Ext(name) != "" {
			http.NotFound(w, r)
			return
		}
		file, err = h.web.Open("index.html")
		name = "index.html"
	}
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() {
		http.NotFound(w, r)
		return
	}
	if contentType := mime.TypeByExtension(path.Ext(name)); contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}
	for _, encoding := range []string{"br", "gzip"} {
		if !acceptsEncoding(r.Header.Get("Accept-Encoding"), encoding) {
			continue
		}
		extension := ".br"
		if encoding == "gzip" {
			extension = ".gz"
		}
		compressed, openErr := h.web.Open(name + extension)
		if openErr != nil {
			continue
		}
		compressedInfo, statErr := compressed.Stat()
		if statErr != nil || !compressedInfo.Mode().IsRegular() {
			compressed.Close()
			continue
		}
		file = compressed
		defer compressed.Close()
		w.Header().Set("Content-Encoding", encoding)
		break
	}
	w.Header().Set("Vary", "Accept-Encoding")
	if strings.HasPrefix(name, "assets/") && (strings.HasSuffix(name, ".js") || strings.HasSuffix(name, ".css")) {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else if strings.HasPrefix(name, "assets/") && (strings.HasSuffix(name, ".png") || strings.HasSuffix(name, ".jpg") || strings.HasSuffix(name, ".woff2")) {
		w.Header().Set("Cache-Control", "public, max-age=86400")
	} else {
		w.Header().Set("Cache-Control", "no-cache")
	}
	http.ServeContent(w, r, info.Name(), info.ModTime(), file)
}

func acceptsEncoding(header, encoding string) bool {
	for _, part := range strings.Split(header, ",") {
		pieces := strings.Split(strings.TrimSpace(part), ";")
		if pieces[0] != encoding {
			continue
		}
		for _, parameter := range pieces[1:] {
			parameter = strings.TrimSpace(parameter)
			if strings.HasPrefix(parameter, "q=") {
				quality, err := strconv.ParseFloat(strings.TrimPrefix(parameter, "q="), 64)
				if err != nil || quality <= 0 {
					return false
				}
			}
		}
		return true
	}
	return false
}
