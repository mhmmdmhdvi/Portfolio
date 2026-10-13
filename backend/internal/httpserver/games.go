package httpserver

func entertainmentFolder() fileEntry {
	return fileEntry{Name: "سرگرمی", Path: "entertainment", Kind: "folder"}
}

func gameShortcuts() []fileEntry {
	games := []struct{ id, title string }{
		{"solitaire", "Solitaire"}, {"snake", "Snake"}, {"twenty48", "2048"},
		{"breakout", "Breakout"}, {"pinball", "Pinball"}, {"chess", "Chess"},
		{"minesweeper", "Minesweeper"},
	}
	files := make([]fileEntry, 0, len(games))
	for _, game := range games {
		files = append(files, fileEntry{Name: game.title, Path: "entertainment/" + game.id, Kind: "app", AppID: game.id})
	}
	return files
}
