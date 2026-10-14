package httpserver

func resumeDocument() fileEntry {
	return fileEntry{Name: "Resume", Path: "resume/document", Kind: "app", AppID: "resume"}
}

func contactDocument() fileEntry {
	return fileEntry{Name: "Contact Me", Path: "contact/details", Kind: "app", AppID: "contact"}
}
