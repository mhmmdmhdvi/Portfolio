package httpserver

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestContactShortcut(t *testing.T) {
	handler := fixture(t)
	for _, directory := range []string{"home", "desktop", "contact"} {
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
		if directory == "contact" {
			if len(response.Files) != 1 || response.Files[0].Name != "Contact Me" || response.Files[0].AppID != "contact" || response.Files[0].Kind != "app" {
				t.Fatalf("unexpected contact entries: %+v", response.Files)
			}
			continue
		}
		found := false
		for _, entry := range response.Files {
			if entry.Name == "Contact Me" && entry.AppID == "contact" && entry.Kind == "app" {
				found = true
			}
		}
		if !found {
			t.Fatalf("%s is missing Contact Me", directory)
		}
	}
}
