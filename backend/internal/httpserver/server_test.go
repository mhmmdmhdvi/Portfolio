package httpserver

import (
	"compress/gzip"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func fixture(t *testing.T) http.Handler {
	t.Helper()
	content := t.TempDir()
	web := t.TempDir()
	if err := os.WriteFile(filepath.Join(content, "resume.pdf"), []byte("%PDF-1.7 test"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(content, "secret.env"), []byte("SECRET=private"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(web, "index.html"), []byte("<!doctype html><title>Windows 11</title>"), 0600); err != nil {
		t.Fatal(err)
	}
	handler, err := New(Config{ContentDir: content, WebDir: web})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(handler.Close)
	return handler
}

func TestReadOnly(t *testing.T) {
	handler := fixture(t)
	for _, method := range []string{"POST", "PUT", "PATCH", "DELETE"} {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest(method, "/api/files", strings.NewReader("data")))
		if recorder.Code != http.StatusMethodNotAllowed {
			t.Errorf("%s: got %d", method, recorder.Code)
		}
	}
}

func TestWebSearchHasNoBackendEndpoint(t *testing.T) {
	recorder := httptest.NewRecorder()
	fixture(t).ServeHTTP(recorder, httptest.NewRequest("GET", "/api/search?q=react", nil))
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("unexpected search endpoint: %d", recorder.Code)
	}
}

func TestSecurityHeaders(t *testing.T) {
	recorder := httptest.NewRecorder()
	fixture(t).ServeHTTP(recorder, httptest.NewRequest("GET", "/", nil))
	for name, want := range map[string]string{"X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer"} {
		if recorder.Header().Get(name) != want {
			t.Errorf("missing %s", name)
		}
	}
	csp := recorder.Header().Get("Content-Security-Policy")
	if !strings.Contains(csp, "script-src 'self'") || !strings.Contains(csp, "frame-ancestors 'none'") || !strings.Contains(csp, "frame-src 'none'") {
		t.Errorf("unsafe CSP: %s", csp)
	}
}

func TestGamesFolder(t *testing.T) {
	handler := fixture(t)
	for _, directory := range []string{"home", "desktop", "games"} {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest("GET", "/api/files?path="+directory, nil))
		if recorder.Code != http.StatusOK {
			t.Fatalf("%s: %d", directory, recorder.Code)
		}
		var response struct {
			Files []struct {
				Name  string `json:"name"`
				Path  string `json:"path"`
				Kind  string `json:"kind"`
				AppID string `json:"appId"`
			} `json:"files"`
		}
		if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
			t.Fatal(err)
		}
		if directory != "games" {
			found := false
			for _, file := range response.Files {
				if file.Name == "Games" && file.Path == "games" && file.Kind == "folder" {
					found = true
				}
			}
			if !found {
				t.Fatalf("%s is missing games folder", directory)
			}
			continue
		}
		if len(response.Files) != 7 {
			t.Fatalf("expected seven games, got %d", len(response.Files))
		}
		for _, file := range response.Files {
			if file.Kind != "app" || file.Path != "games/"+file.AppID || file.AppID == "" {
				t.Fatalf("invalid shortcut: %+v", file)
			}
		}
	}
}

func TestFilesHideUnsupportedAndPrivateFiles(t *testing.T) {
	recorder := httptest.NewRecorder()
	fixture(t).ServeHTTP(recorder, httptest.NewRequest("GET", "/api/files?path=documents", nil))
	if recorder.Code != 200 {
		t.Fatalf("got %d", recorder.Code)
	}
	var result struct {
		Files []struct {
			Name string `json:"name"`
		} `json:"files"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if len(result.Files) != 1 || result.Files[0].Name != "resume.pdf" {
		t.Fatalf("unexpected files: %s", recorder.Body.String())
	}
}

func TestRejectsTraversalAndHiddenFiles(t *testing.T) {
	handler := fixture(t)
	for _, target := range []string{"/api/content/secret.env", "/api/content/../go.mod", "/api/content/%2e%2e%2fgo.mod", "/api/files?path=../../", "/api/files?path=documents/../.."} {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest("GET", target, nil))
		if recorder.Code < 400 {
			t.Errorf("allowed %s: %d", target, recorder.Code)
		}
	}
}

func TestServesOnlyAllowedContent(t *testing.T) {
	recorder := httptest.NewRecorder()
	fixture(t).ServeHTTP(recorder, httptest.NewRequest("GET", "/api/content/resume.pdf", nil))
	if recorder.Code != 200 || recorder.Header().Get("Content-Type") != "application/pdf" {
		t.Fatalf("got %d %s", recorder.Code, recorder.Header().Get("Content-Type"))
	}
}

func TestRejectsCrossOriginRequests(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest("GET", "/api/files?path=documents", nil)
	request.Header.Set("Origin", "https://untrusted.example")
	fixture(t).ServeHTTP(recorder, request)
	if recorder.Code != http.StatusForbidden {
		t.Fatalf("got %d", recorder.Code)
	}
}

func TestServesCompressedAssets(t *testing.T) {
	content := t.TempDir()
	web := t.TempDir()
	html := []byte("<!doctype html><title>Windows 11</title>")
	if err := os.WriteFile(filepath.Join(web, "index.html"), html, 0600); err != nil {
		t.Fatal(err)
	}
	file, err := os.Create(filepath.Join(web, "index.html.gz"))
	if err != nil {
		t.Fatal(err)
	}
	writer := gzip.NewWriter(file)
	writer.Write(html)
	writer.Close()
	file.Close()
	handler, err := New(Config{ContentDir: content, WebDir: web})
	if err != nil {
		t.Fatal(err)
	}
	defer handler.Close()
	for _, encoding := range []string{"gzip", "gzip;q=0"} {
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest("GET", "/", nil)
		request.Header.Set("Accept-Encoding", encoding)
		handler.ServeHTTP(recorder, request)
		if encoding == "gzip;q=0" {
			if recorder.Header().Get("Content-Encoding") != "" {
				t.Fatal("ignored q=0")
			}
			continue
		}
		if recorder.Header().Get("Content-Encoding") != "gzip" {
			t.Fatalf("not compressed: %v", recorder.Header())
		}
		reader, err := gzip.NewReader(recorder.Body)
		if err != nil {
			t.Fatal(err)
		}
		decoded, err := io.ReadAll(reader)
		reader.Close()
		if err != nil || string(decoded) != string(html) {
			t.Fatal("corrupted response")
		}
	}
}

func TestRateLimitsRequests(t *testing.T) {
	handler := fixture(t)
	for i := 0; i < 60; i++ {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest("GET", "/api/health", nil))
		if recorder.Code != 200 {
			t.Fatalf("request %d: %d", i, recorder.Code)
		}
	}
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest("GET", "/api/health", nil))
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("not rate limited: %d", recorder.Code)
	}
}

func TestRejectsSymlinksToHiddenContent(t *testing.T) {
	content := t.TempDir()
	private := filepath.Join(content, ".private")
	if err := os.Mkdir(private, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(private, "secret.txt"), []byte("private"), 0600); err != nil {
		t.Fatal(err)
	}
	requestPath := "/api/content/public.txt"
	if err := os.Symlink(filepath.Join(".private", "secret.txt"), filepath.Join(content, "public.txt")); err != nil {
		if runtime.GOOS != "windows" {
			t.Fatal(err)
		}
		junction := filepath.Join(content, "public")
		if output, err := exec.Command("cmd", "/c", "mklink", "/J", junction, private).CombinedOutput(); err != nil {
			t.Fatalf("junction creation: %v %s", err, output)
		}
		requestPath = "/api/content/public/secret.txt"
	}
	handler, err := New(Config{ContentDir: content})
	if err != nil {
		t.Fatal(err)
	}
	defer handler.Close()
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest("GET", requestPath, nil))
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("served private target: %d %s", recorder.Code, recorder.Body.String())
	}
}
