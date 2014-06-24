(ns kioo.docs.site
  (:require [kioo.om :refer [content set-attr do-> wrap substitute prepend listen append before after]]
            [kioo.core :refer [handle-wrapper]]
            [om.core :as om :include-macros true]
            [om.dom :as dom :include-macros true]
            [kioo.docs.post-data :refer [doc-state]]
            [markdown.core :as md]
            [ajax.core :refer [GET]]
            [clojure.string :as string]
            [secretary.core :as secretary :include-macros true :refer [defroute]]
            [goog.events :as events]
            [goog.history.EventType :as EventType])
  (:require-macros [kioo.om :refer [defsnippet deftemplate]])
  (:import goog.History))

(enable-console-print!)

;; -
;; Loading full text markdown posts:
;; -

(defn post-handler [response])

(defn fetch-error-handler [{:keys [status status-text]} file]
  (js/alert (str "File not found, if you have a moment tell us that 
                  we couldn't locate: " file)))

(defn fetch-post 
  "Grab a markdown post"
  [post]
  (GET (str "./pages/" post ".txt") 
       {:handler post-handler
        :error-handler #(fetch-error-handler % (str "./pages/" post ".txt"))}))

;; -
;; Snippets and Pages
;; -

;; --------........________
;; Single Post View
(defsnippet kioo__single "templates/single.html" 
  [:#kioo__single] [_])

;; --------........________
;; Three pannel intro blurb
(defsnippet kioo__introduction "templates/main.html" 
  [:#kioo__introduction] [_])


;; --------........________
;; Single Widget Card
(defsnippet kioo__card--widget "templates/widgets.html" 
  [:.kioo__card--widget] [{:keys [title file excerpt tags]}]
  {[:.panel-title] (content title)
   [:.panel-body :.btn] (set-attr :href (str "#!/widget/" file))
   [:.kioo__excerpt] (content excerpt)}) 


;; --------........________
;; Single Documentation Card
(defsnippet kioo__card--doc "templates/docs.html" 
  [:.kioo__card--doc] [{:keys [title file excerpt tags]}]
  {[:.panel-title] (content title)
   [:.panel-body :.btn] (set-attr :href (str "#!/doc/" file))
   [:.kioo__excerpt] (content excerpt)}) 


;; --------........________
;; Widget Deck Wrapper
(defsnippet kioo__deck--widgets "templates/widgets.html" 
  [:#kioo__deck--widgets] [widgets_vector]
  {[:.kioo__card--widget] (substitute (map kioo__card--widget widgets_vector))})


;; --------........________
;; Documentation Deck Wrapper
(defsnippet kioo__deck--docs "templates/docs.html" 
  [:#kioo__deck--docs] [docs_vector]
  {[:.kioo__card--doc] (substitute (map kioo__card--doc docs_vector))})   ;; Target | Data


;; --------........________
;; Widget Deck Title & Search
(defsnippet kioo__nav--widgets "templates/widgets.html" 
  [:#kioo__nav--widgets] [_])


;; --------........________
;; Documentation Deck Title & Search
(defsnippet kioo__nav--docs "templates/docs.html" 
  [:#kioo__nav--docs] [_])


;; --------........________
;; Top Fixed Site Navigation
(defsnippet kioo__nav--site "templates/navigation.html" 
  [:#kioo__nav--site] [_])


;; --------........________
;; Top Fixed Site Navigation
(deftemplate main "templates/main.html"
  [data]
  {[:#kioo__greeting] (do-> (content (kioo__introduction  data))  ;;Appears that order matters
                            (before  (kioo__nav--site     data))) ;; before can't be before content in a 'do->'
   [:#kioo__decks] (content (kioo__nav--docs      (:docs data))
                            (kioo__deck--docs     (:docs data))
                            (kioo__nav--widgets   (:widgets data))
                            (kioo__deck--widgets  (:widgets data)))
   [:#kioo__footer] (after  (kioo__single         (:current data)))})


;; -
;; It's a rout
;; -

(secretary/set-config! :prefix "#")


;; --------........________
;; /#!/doc/<fil_name>
(defroute doc-path "!/doc/:file" [file]
  (if file 
    (fetch-post file)))

;; --------........________
;; /#!/widget/<fil_name>
(defroute widget-path "!/widget/:file" [file]
  (if file 
    (fetch-post file)))

;; --------........________
;; #/<*>
(defroute all "/*" []
  (prn "Star"))


;; --------........________
;; History 
(let [h (History.)]
  (goog.events/listen h EventType/NAVIGATE #(secretary/dispatch! (.-token %)))
  (doto h (.setEnabled true)))


;; -
;; App State and OM Init
;; -

(defn init [data] (om/component (main data)))

(om/root init doc-state {:target  (. js/document (getElementById "site"))})