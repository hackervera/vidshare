(ns vidshare.handler
  (:gen-class)
  (:use 
    compojure.core
    org.httpkit.server
    ring.util.json-response
    clojure.xml
    clojure.data.finger-tree
    org.httpkit.timer)
  (:require [compojure.handler :as handler]
            [compojure.route :as route]
            [clojure.java.io :as io]
            [clojure.data.json :as json]
            [org.httpkit.client :as http]))


(def channels (atom {}))
(def songs (atom (double-list)))
(def playing (atom {}))
(def votes (atom {}))

(defn update-channels [params]
  (doseq [[id channel] @channels] (send! channel {:headers {"Content-Type" "text/event-stream"} :body (str "event: " (:event params) "\ndata: " (:data params)  "\n\n")} false))
  (str "Updated channels with " params "\n\n"))

(defn update-channel [channel event data]
   (send! channel {:headers {"Content-Type" "text/event-stream"} :body (str "event: " event "\ndata: " data  "\n\n")} false))

(defn play-next []
  (if-let [song (last @songs)]
    (do 
      (reset! playing song)
      (reset! votes {})
      (swap! songs pop)
      (update-channels {:event "playing" :data (json/write-str @playing)})
      (update-channels {:event "requests" :data (json/write-str (into [] (reverse @songs)))})
      (schedule-task (* 1000 (:duration song)) (play-next))
      "Playing next song")
    (do
      (reset! playing {})
      "No more songs"))) 

(defn vote-count [cid]
  (if (contains? @channels (java.util.UUID/fromString cid)) (swap! votes assoc cid 1))
  (prn (count @votes) (count @channels))
  (if (>= (count @votes) (/ (count @channels) 2))
    (play-next))
  "counting votes")


(defn data-handler [request]
  (with-channel request channel
    (let [id (java.util.UUID/randomUUID)]
        (swap! channels assoc id channel)
        (prn channels)
        (update-channel channel "cid" id)
        (on-close channel (fn [status] (prn "channel closed " status id) (swap! channels dissoc id) (swap! votes dissoc id))))))

(defn request-song [params]
    (let [vid (second (re-find #"v=(.*)" (:url params)))
          json-data (-> (http/get (str "https://gdata.youtube.com/feeds/api/videos/" vid "?v=2&alt=json")) deref :body (json/read-str :key-fn keyword))
          title (-> json-data :entry :title :$t)
          duration (-> json-data :entry :media$group :media$content first :duration)
          song {:title title :vid vid :duration duration}]
      (prn song)
      (if (= @playing {}) 
        (do 
          (reset! playing song)
          (update-channels {:event "playing" :data (json/write-str @playing)})
          (schedule-task (* 1000 (:duration song)) (play-next)))
        (do 
          (swap! songs conjl song)
          (update-channels {:event "requests" :data (json/write-str (into [] (reverse @songs)))})))
      "updated request queue"))


(defroutes app-routes
  (GET "/" [] (slurp (clojure.java.io/resource "public/index.html")))
  (GET "/data" [] data-handler)
  (POST "/request" {params :params} (request-song params))
  (GET "/queue" [] (json-response (reverse @songs)))
  (GET "/playing" [] (json-response @playing))
  (GET "/skip/:cid" [cid] (vote-count cid))
  (route/resources "/")
  (route/not-found "Not Found"))

(def app
  (handler/site app-routes))


(defn -main [& args]
 (run-server app {:port 3000 :thread 100}))



