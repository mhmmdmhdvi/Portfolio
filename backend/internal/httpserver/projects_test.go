package httpserver

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestProjectsShortcut(t *testing.T) {
	handler := fixture(t)
	for _, directory := range []string{"home", "desktop"} {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest("GET", "/api/files?path="+directory, nil))
		var response struct {
			Files []fileEntry `json:"files"`
		}
		if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
			t.Fatal(err)
		}
		found := false
		for _, entry := range response.Files {
			if entry.Name == "Projects" && entry.Kind == "app" && entry.AppID == "projects" {
				found = true
			}
		}
		if !found {
			t.Fatalf("%s is missing the Projects shortcut", directory)
		}
	}
}

func TestCachesProjectImagesAndServesProjectLinks(t *testing.T) {
	web := t.TempDir()
	if err := os.MkdirAll(filepath.Join(web, "assets", "projects"), 0700); err != nil {
		t.Fatal(err)
	}
	image := []byte("project preview")
	if err := os.WriteFile(filepath.Join(web, "assets", "projects", "cover.webp"), image, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(web, "index.html"), []byte("portfolio"), 0600); err != nil {
		t.Fatal(err)
	}
	handler, err := New(Config{ContentDir: t.TempDir(), WebDir: web})
	if err != nil {
		t.Fatal(err)
	}
	defer handler.Close()
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest("GET", "/assets/projects/cover.webp", nil))
	if recorder.Code != http.StatusOK || recorder.Header().Get("Cache-Control") != "public, max-age=86400" || recorder.Body.String() != string(image) {
		t.Fatalf("unexpected image response: %d %v", recorder.Code, recorder.Header())
	}
	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest("GET", "/projects/honor-preinvoice", nil))
	if recorder.Code != http.StatusOK || recorder.Body.String() != "portfolio" {
		t.Fatalf("project link: %d %s", recorder.Code, recorder.Body.String())
	}
}
