package main

import (
	"log"
	"net/http"
)

func main() {
	const ContentType = "Content-Type"

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(ContentType, "text/html")
		http.ServeFile(w, r, "./index.html")
	})

	http.HandleFunc("/htmx-asciidoc.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(ContentType, "application/javascript")
		http.ServeFile(w, r, "../../asciidoc/htmx-asciidoc.js")
	})

	http.HandleFunc("/readme", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(ContentType, "text/asciidoc")
		http.ServeFile(w, r, "../../README.adoc")
	})

	log.Println("Serving on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
