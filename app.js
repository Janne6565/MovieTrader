var vm = new Vue({
    el: '#app',
    data() {
        return {
            movies: [],
            media_type: "movie",
            searchQueries: {},
            language: "de-DE",
            pageOn: 0,
            loggedIn: false,
            dataGet: {},
            alreadyDone: [],
            informationsOpened: false,
            county: -1,
        }
    },
    methods: {
        async setDrag(){
            let box = document.getElementById('informations');
            let firstTouch = 0;
            box.addEventListener('touchstart', function(e){
                firstTouch = e.targetTouches[0].pageY;
            }, {passive:true});

            box.addEventListener('touchmove', function(e) {
                let touchNow = e.targetTouches[0].pageY;
                if (firstTouch - touchNow > 50){
                    if (box.children)
                    box.classList.add("opened");
                }
                if (firstTouch - touchNow < -50 && box.scrollTop <= 38){
                    box.classList.remove("opened");
                }

            }, {passive:true});
        },
        async setCharAt(str,index,chr) {
            if(index > str.length-1) return str;
            return str.substring(0,index) + chr + str.substring(index+1);
        },
        async setSwipeSites(){
            var self = this;
            let box = document.getElementById('rectImg');
            let firstTouch = 0;
            box.addEventListener('touchstart', function(e){
                firstTouch = e.targetTouches[0].pageX;
            }, {passive:true});

            box.addEventListener('touchmove', function(e) {
                let touchNow = e.targetTouches[0].pageX;
                if (firstTouch - touchNow > 50){
                    if (self.pageOn === 0) {
                        self.changePage(1);
                    }
                }
                if (firstTouch - touchNow < -50){
                    if (self.pageOn === 1) {
                        self.changePage(-1);
                    }
                }

            }, {passive:true});
        },
        async likeMovie(movieId, type) {
            this.pageOn = 0;
            var self = this;
            const userID = localStorage.getItem("UserID");
            const auth = localStorage.getItem("Auth");
            if (userID !== null && auth !== null) {
                var data = new FormData();
                data.append("userId", userID);
                data.append("userAuth", auth);
                data.append("movieId", movieId);
                data.append("type", type);
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "./api/add/movieToListPositive.php");
                xhr.send(data);
                xhr.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        self.movies = [];
                        self.search();
                        const response = this.response;
                        if (response["Status"] !== "Error") {
                            console.log("Successfully added movie");
                        }
                    }
                };
                var dataCheckFriends = new FormData();
                dataCheckFriends.append("userId", userID);
                dataCheckFriends.append("userAuth", auth);
                dataCheckFriends.append("movieId", movieId);
                var xhrChecKFriends = new XMLHttpRequest();
                xhrChecKFriends.open('POST', './api/check/movieListFriend.php');
                xhrChecKFriends.send(dataCheckFriends);
                xhrChecKFriends.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        const res = JSON.parse(this.response);
                        if (res.Status !== "Error" && this.response !== "[]") {
                            let friends = "";
                            let count = 0;
                            let someIn = false;
                            for (let i in res) {
                                if (count !== 0) friends += ", ";
                                friends += JSON.parse(res[i]).Username;
                                someIn = true;
                            }
                            if (someIn) alert('Match! \nDieser Film wurde von ' + friends + ' gematched');
                        }
                    }
                };
            }
        },
        async dislikeMovie(movieId, type){
            this.pageOn = 0;
            var self = this;
            const userID = localStorage.getItem("UserID");
            const auth = localStorage.getItem("Auth");
            if (userID !== null && auth !== null) {
                var data = new FormData();
                data.append("userId", userID);
                data.append("userAuth", auth);
                data.append("movieId", movieId);
                data.append("type", type);
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "./api/add/movieToListNegative.php");
                xhr.send(data);
                xhr.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        self.movies = [];
                        self.search();
                        const response = this.response;
                        if (response["Status"] !== "Error") {
                            console.log("Successfully added movie");
                        }
                    }
                };
            }
        },
        changePage(change){
            this.pageOn = this.pageOn + change;
        },
        async search(){
            var self = this;
            const userID = localStorage.getItem("UserID");
            const auth = localStorage.getItem("Auth");
            let xhrQueries = new XMLHttpRequest();
            var formData = new FormData();
            formData.append("userId", userID);
            formData.append("userAuth", auth);
            xhrQueries.open("POST", "./api/get/filters.php")
            xhrQueries.send(formData);
            xhrQueries.onreadystatechange = async function () {
                if (this.readyState === 4 && this.status === 200) {
                    const resp = JSON.parse(this.response);
                    let queries = ""
                    for (let i in resp) {
                        let res = JSON.parse(resp[i]);
                        queries += res.Selector + "=" + res.Value + "&";
                    }
                    let unsolved = true
                    let countRows = 0
                    let page = 1;
                    let runs = 0;
                    while (unsolved) {
                        runs++;
                        if (runs >= 19) {
                            page++;
                        }
                        const response = await fetch("https://api.themoviedb.org/3/discover/" + self.media_type + "?api_key=de51817441f3aca4f2ec89ee99f6c68c&" + queries + "&page=" + page.toString());
                        const data = await response.json();
                        const numMovie = Math.round(Math.random() * 19)
                        const movieID = data["results"][numMovie]["id"];
                        if (self.alreadyDone === undefined) {
                            self.alreadyDone.push(movieID.toString())
                            const responseFinalMovie = await fetch("https://api.themoviedb.org/3/" + this.media_type + "/" + movieID + "?api_key=de51817441f3aca4f2ec89ee99f6c68c&language=" + this.language)
                            let thisMovie = await responseFinalMovie.json();
                            thisMovie.poster_path = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2" + thisMovie["poster_path"]
                            if (thisMovie["backdrop_path"] == null) {
                                thisMovie.backdrop_path = null;
                            } else {
                                thisMovie.backdrop_path = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2" + thisMovie["backdrop_path"]
                            }

                            let genres = ""
                            let count = 0
                            for (let i in thisMovie["genres"]) {
                                if (count !== 0) {
                                    genres += ", "
                                }
                                genres += thisMovie["genres"][i]["name"]
                                count++;
                            }
                            thisMovie.genres = genres
                            let dateParsed = new Date(thisMovie.release_date)
                            thisMovie.release_date = dateParsed.toLocaleDateString().replace("/", ".").replace("/", ".")

                            const responseProviders = await fetch("https://api.themoviedb.org/3/movie/" + movieID + "/watch/providers?api_key=de51817441f3aca4f2ec89ee99f6c68c")
                            let jsonProviders = await responseProviders.json()
                            let providers = []
                            for (let country in jsonProviders["results"]) {
                                for (let type in jsonProviders["results"][country]) {
                                    if (type !== "link") {
                                        for (let num in jsonProviders["results"][country][type]) {
                                            const short = jsonProviders["results"][country][type][num];
                                            let isIn = false;
                                            for (let provider in providers) {
                                                if (provider.id === short["provider_id"]) {
                                                    provider.countrys.push(country);
                                                    provider.type.push(type);
                                                    isIn = true;
                                                }
                                            }
                                            if (!isIn) {
                                                const prov = {
                                                    "type": [type],
                                                    "countrys": [country],
                                                    "name": short["provider_name"],
                                                    "id": short["provider_id"],
                                                    "logo_path": "https://www.themoviedb.org/t/p/original/" + short["logo_path"],
                                                }
                                                providers.push(prov);
                                            }
                                        }
                                    }
                                }
                            }
                            thisMovie["publisher"] = {}
                            self.movies.push(jsonProviders);
                            thisMovie["publisher"]["rents"] = rents
                            countRows++;
                            if (countRows === 1) {
                                unsolved = false;
                            }
                        } else if (self.alreadyDone.indexOf(movieID.toString()) === -1) {
                            self.alreadyDone.push(movieID.toString())
                            const responseFinalMovie = await fetch("https://api.themoviedb.org/3/" + self.media_type + "/" + movieID + "?api_key=de51817441f3aca4f2ec89ee99f6c68c&language=" + self.language)
                            let thisMovie = await responseFinalMovie.json();
                            thisMovie.poster_path = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2" + thisMovie["poster_path"]
                            if (thisMovie["backdrop_path"] == null) {
                                thisMovie.backdrop_path = null;
                            } else {
                                thisMovie.backdrop_path = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2" + thisMovie["backdrop_path"]
                            }

                            let genres = ""
                            let count = 0
                            for (let i in thisMovie["genres"]) {
                                if (count !== 0) {
                                    genres += ", "
                                }
                                genres += thisMovie["genres"][i]["name"]
                                count++;
                            }
                            thisMovie.genres = genres
                            let dateParsed = new Date(thisMovie.release_date)
                            thisMovie.release_date = dateParsed.toLocaleDateString().replace("/", ".").replace("/", ".")

                            const responseProviders = await fetch("https://api.themoviedb.org/3/movie/" + movieID + "/watch/providers?api_key=de51817441f3aca4f2ec89ee99f6c68c")
                            let jsonProviders = await responseProviders.json()
                            let providers = []
                            for (let country in jsonProviders["results"]) {
                                for (let type in jsonProviders["results"][country]) {
                                    if (type !== "link") {
                                        for (let num in jsonProviders["results"][country][type]) {
                                            const short = jsonProviders["results"][country][type][num];
                                            let isIn = false;
                                            for (let prov in providers) {
                                                const provider = providers[prov];
                                                if (provider.id === short["provider_id"]) {
                                                    if (provider.type.indexOf(type) === !-1) {
                                                        provider.type.push(type)
                                                    }

                                                    provider.countrys.push(country);
                                                    isIn = true;
                                                }
                                            }
                                            if (!isIn) {
                                                let prov = {
                                                    "type": [await self.setCharAt(type, 0, type[0].toUpperCase())],
                                                    "countrys": [await self.setCharAt(country, 0, country[0].toUpperCase())],
                                                    "name": short["provider_name"],
                                                    "id": short["provider_id"],
                                                    "logo_path": "https://www.themoviedb.org/t/p/original/" + short["logo_path"],
                                                }
                                                providers.push(prov);
                                            }
                                        }
                                    }
                                }
                            }
                            thisMovie["publisher"] = providers
                            self.movies.push(thisMovie);
                            countRows++;
                            if (countRows === 1) {
                                unsolved = false;
                            }
                        }
                    }
                }
            }
        }
    },
    async created(){
        var self = this;
        this.language = navigator.language;
        const userID = localStorage.getItem("UserID");
        const auth = localStorage.getItem("Auth");
        if (userID !== null && auth !== null) {
            var data = new FormData();
            data.append("userId", userID);
            data.append("userAuth", auth);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "./api/get/user.php");
            xhr.send(data);
            xhr.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    if (JSON.parse(this.response) !== {"Status": "Error"}) {
                        var antwort = JSON.parse(this.response);
                        var dataNew = new FormData();
                        dataNew.append("userId", userID);
                        dataNew.append("userAuth", auth);
                        var xhrNew = new XMLHttpRequest();
                        xhrNew.open("POST", "./api/get/listMovies.php");
                        xhrNew.send(data);
                        xhrNew.onreadystatechange = function () {
                            if (this.readyState === 4 && this.status === 200) {
                                const response = JSON.parse(this.response);
                                if (response["Status"] !== "Error") {
                                    let movies = response["Result"];
                                    for (let thing of movies) {
                                        const movie = JSON.parse(thing);
                                        self.alreadyDone.push(movie['ID']);
                                    }
                                }
                            }
                        }

                        if (antwort["Status"] !== "Error") {
                            self.dataGet = JSON.parse(antwort["Result"]);
                            self.loggedIn = true;
                        }
                    }
                } else {
                    self.loggedIn = false;
                }
            };
        }else{
            self.loggedIn = false;
        }
        self.search();
    },

});