package httpserver

import (
	"encoding/json"
	"io/fs"
	"mime"
	"net/http"
	"os"
	"path"
	"sort"
	"strings"
)

type fileEntry struct {
	Name     string `json:"name"`
	Path     string `json:"path"`
	Kind     string `json:"kind"`
	Size     int64  `json:"size"`
	Modified string `json:"modified,omitempty"`
	AppID    string `json:"appId,omitempty"`
}

var allowedTypes = map[string]string{
	".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8",
	".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
	".webp": "image/webp", ".gif": "image/gif", ".mp3": "audio/mpeg",
	".mp4": "video/mp4",
}

func safePath(name string) bool {
	if !fs.ValidPath(name) || strings.ContainsAny(name, "\\:\x00") {
		return false
	}
	for _, component := range strings.Split(name, "/") {
		if strings.HasPrefix(component, ".") {
			return false
		}
	}
	return true
}

func writeJSON(w http.ResponseWriter, r *http.Request, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if r.Method != http.MethodHead {
		json.NewEncoder(w).Encode(value)
	}
}

func (h *Handler) listFiles(w http.ResponseWriter, r *http.Request) {
	directory := r.URL.Query().Get("path")
	files := make([]fileEntry, 0)
	if directory == "home" || directory == "this-pc" || directory == "" {
		for _, name := range []string{"Desktop", "Documents", "Downloads", "Music", "Pictures", "Videos"} {
			files = append(files, fileEntry{Name: name, Path: strings.ToLower(name), Kind: "folder"})
		}
		files = append(files, gamesFolder())
		files = append(files, resumeDocument(), contactDocument(), projectsDocument())
		writeJSON(w, r, map[string]any{"files": files})
		return
	}
	if !safePath(directory) {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	if directory == "desktop" {
		writeJSON(w, r, map[string]any{"files": []fileEntry{gamesFolder(), resumeDocument(), contactDocument(), projectsDocument()}})
		return
	}
	if directory == "games" {
		writeJSON(w, r, map[string]any{"files": gameShortcuts()})
		return
	}
	if directory == "resume" || directory == "documents/resume" {
		writeJSON(w, r, map[string]any{"files": []fileEntry{resumeDocument()}})
		return
	}
	if directory == "contact" {
		writeJSON(w, r, map[string]any{"files": []fileEntry{contactDocument()}})
		return
	}
	if directory == "downloads" || directory == "pictures" || directory == "music" || directory == "videos" || directory == "recycle-bin" {
		writeJSON(w, r, map[string]any{"files": files})
		return
	}
	if directory != "documents" && !strings.HasPrefix(directory, "documents/") {
		http.NotFound(w, r)
		return
	}
	relative := strings.TrimPrefix(directory, "documents/")
	if directory == "documents" {
		relative = "."
	}
	folder, err := h.openContent(relative)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer folder.Close()
	entries, err := folder.ReadDir(1000)
	if err != nil && len(entries) == 0 {
		http.NotFound(w, r)
		return
	}
	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), ".") || entry.Type()&fs.ModeSymlink != 0 {
			continue
		}
		if !entry.IsDir() && allowedTypes[strings.ToLower(path.Ext(entry.Name()))] == "" {
			continue
		}
		info, err := entry.Info()
		if err != nil || (!entry.IsDir() && (!info.Mode().IsRegular() || info.Size() > 32<<20)) {
			continue
		}
		kind := "file"
		if entry.IsDir() {
			kind = "folder"
		}
		files = append(files, fileEntry{Name: entry.Name(), Path: path.Join(directory, entry.Name()), Kind: kind, Size: info.Size(), Modified: info.ModTime().UTC().Format("2006-01-02T15:04:05Z")})
	}
	sort.Slice(files, func(i, j int) bool {
		if files[i].Kind != files[j].Kind {
			return files[i].Kind == "folder"
		}
		return strings.ToLower(files[i].Name) < strings.ToLower(files[j].Name)
	})
	writeJSON(w, r, map[string]any{"files": files})
}

func (h *Handler) serveContent(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/api/content/")
	contentType := allowedTypes[strings.ToLower(path.Ext(name))]
	if !safePath(name) || contentType == "" {
		http.NotFound(w, r)
		return
	}
	file, err := h.openContent(name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() > 32<<20 {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", mime.FormatMediaType("inline", map[string]string{"filename": info.Name()}))
	http.ServeContent(w, r, info.Name(), info.ModTime(), file)
}

func (h *Handler) openContent(name string) (*os.File, error) {
	if name == "." {
		return h.content.Open(name)
	}
	if !safePath(name) {
		return nil, os.ErrPermission
	}
	current := ""
	for _, component := range strings.Split(name, "/") {
		current = path.Join(current, component)
		info, err := h.content.Lstat(current)
		if err != nil {
			return nil, err
		}
		if info.Mode()&fs.ModeSymlink != 0 {
			return nil, os.ErrPermission
		}
	}
	return h.content.Open(name)
}
