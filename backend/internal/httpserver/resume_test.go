package httpserver

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestResumeShortcutAndDownload(t *testing.T) {
	content := t.TempDir()
	if err := os.Mkdir(filepath.Join(content, "resume"), 0700); err != nil {
		t.Fatal(err)
	}
	pdf := []byte("%PDF-1.7 resume")
	if err := os.WriteFile(filepath.Join(content, "resume", "Mohammad-Mahdavi-Resume.pdf"), pdf, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(content, "resume", "Mohammad-Mahdavi-Resume-fa.pdf"), pdf, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(content, "resume", ".private.txt"), []byte("private"), 0600); err != nil {
		t.Fatal(err)
	}
	handler, err := New(Config{ContentDir: content})
	if err != nil {
		t.Fatal(err)
	}
	defer handler.Close()
	for _, directory := range []string{"home", "desktop", "resume", "documents/resume"} {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest("GET", "/api/files?path="+directory, nil))
		if recorder.Code != http.StatusOK {
			t.Fatalf("%s: status %d", directory, recorder.Code)
		}
		var response struct {
			Files []fileEntry `json:"files"`
		}
		if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
			t.Fatal(err)
		}
		if directory == "home" || directory == "desktop" {
			found := false
			for _, file := range response.Files {
				if file.Name == "Resume" && file.AppID == "resume" && file.Kind == "app" {
					found = true
				}
			}
			if !found {
				t.Fatalf("%s is missing Resume shortcut", directory)
			}
		} else {
			if len(response.Files) != 1 || response.Files[0].Name != "Resume" || response.Files[0].AppID != "resume" || response.Files[0].Kind != "app" {
				t.Fatalf("unexpected Resume entries: %+v", response.Files)
			}
		}
	}
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest("GET", "/api/content/resume/Mohammad-Mahdavi-Resume.pdf", nil))
	if recorder.Code != http.StatusOK || recorder.Header().Get("Content-Type") != "application/pdf" || recorder.Body.String() != string(pdf) {
		t.Fatalf("invalid PDF response: %d", recorder.Code)
	}
}

func TestResumeFolderWithoutPDF(t *testing.T) {
	recorder := httptest.NewRecorder()
	fixture(t).ServeHTTP(recorder, httptest.NewRequest("GET", "/api/files?path=resume", nil))
	if recorder.Code != http.StatusOK {
		t.Fatalf("resume should open without a PDF: %d", recorder.Code)
	}
	var response struct {
		Files []fileEntry `json:"files"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if len(response.Files) != 1 || response.Files[0].AppID != "resume" {
		t.Fatalf("unexpected resume entries: %+v", response.Files)
	}
}
