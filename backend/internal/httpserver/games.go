package httpserver

func gamesFolder() fileEntry {
	return fileEntry{Name: "Games", Path: "games", Kind: "folder"}
}

func gameShortcuts() []fileEntry {
	games := []struct{ id, title string }{
		{"solitaire", "Solitaire"}, {"snake", "Snake"}, {"twenty48", "2048"},
		{"breakout", "Breakout"}, {"pinball", "Pinball"}, {"chess", "Chess"},
		{"minesweeper", "Minesweeper"},
	}
	files := make([]fileEntry, 0, len(games))
	for _, game := range games {
		files = append(files, fileEntry{Name: game.title, Path: "games/" + game.id, Kind: "app", AppID: game.id})
	}
	return files
}
