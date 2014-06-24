(ns kioo.docs.post-data)

;; ----
;; For each entry a .txt file inside ./pages/ must correspond
;; to the naming convention of :file below.

(def doc-state 
  (atom 
    {;; Kioo Documentation Pages
     :docs 	  [
               {:title 	"Getting started with OM" 
                :file  	"starting-with-om" 
                :tags  	["starting" "om"]
                :excerpt "This brief guide will help you get a basic
                          setup of Kioo with OM."}
               {:title 	"Starting with Reagent" 
                :file 	"starting-with-reagent" 
                :tags 	["starting" "reagent"]
                :excerpt "Kioo also works with Reagent, 
                          here is a bare minimum example application."}
               ]
     ;; Pages for bootstrap widgets
     :widgets [
               {:title 	"Filler" 
                :file 	"wrong-file" 
                :tags 	["wrong" "file"]
                :excerpt "Nothing to see here, move along!"}
               ]
     ;; Current post, if any
     :current ""}))