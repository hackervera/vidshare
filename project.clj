(defproject vidshare "0.1.0-SNAPSHOT"
  :description "Video sharing tool for groups"
  :url "http://example.com/FIXME"
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [compojure "1.1.6"]
                 [org.clojure/data.finger-tree "0.0.2"]
                 [http-kit "2.1.16"]
                 [org.clojure/data.json "0.2.4"]
                 [ring-json-response "0.2.0"]
                 [ring/ring-jetty-adapter "1.2.0-beta1"]]
  :plugins [[lein-ring "0.8.10"]]
  :main vidshare.handler
  :ring {:handler vidshare.handler/app}
  :profiles
  {:dev {:dependencies [[javax.servlet/servlet-api "2.5"]
                        [ring-mock "0.1.5"]]}})
