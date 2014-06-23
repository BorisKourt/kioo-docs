(defproject kioo-docs "0.1.6"
  :description "kioo documentation site"
  :url "tba"
  
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/clojurescript "0.0-2234"]
                 [kioo "0.4.1-SNAPSHOT"]
                 [om "0.6.4"]
                 [org.clojure/core.async "0.1.303.0-886421-alpha"]
                 [secretary "1.1.1"]]

  :plugins [[lein-cljsbuild "1.0.3"]]

  :source-paths ["src"]
  :resource-paths ["resources"]

  :cljsbuild {:builds {:prod {:source-paths ["src/cljs"],
                              :compiler {:output-to "resources/js/site.js"
                                         :output-dir "resources/js/out"
                                         :optimizations :advanced
                                         :pretty-print false
                                         :preamble ["js/react.js"]
                                         :externs ["js/react.js"]
                                         :closure-warnings {:externs-validation :off
                                                            :non-standard-jsdoc :off}}}}})