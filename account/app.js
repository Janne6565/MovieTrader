var vm = new Vue({
    el: '#app',
    data() {
        return {
            dataSendLogin: {
                email: "",
                password: "",
            },
            dataSendRegister: {
                email: "",
                password: "",
                pronouns: "",
                username: "",
            },
            dataGet: {
                Username: "Name",
                EMail: "Email",
                ID: "ID",
                Pronouns: "Pronouns",
            },
            personalDatas: {},
            loggedIn: true,
            page: 0,
            listMoviesLiked: [],
            listMoviesDisliked: [],
            language: "",
            friendsVis: false,
            friends: [],
            addEmail: "",
        }
    },
    methods: {
        setCharAt(str,index,chr) {
            if(index > str.length-1) return str;
            return str.substring(0,index) + chr + str.substring(index+1);
        },
        checkFriends(){
            const userID = localStorage.getItem("UserID");
            const auth = localStorage.getItem("Auth");
            var self = this;
            var dataFriends = new FormData();
            dataFriends.append('userId', userID);
            dataFriends.append('userAuth', auth);
            var xhrFriends = new XMLHttpRequest();
            xhrFriends.open('POST', '../api/get/friends.php');
            xhrFriends.send(dataFriends);
            xhrFriends.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    const res = JSON.parse(this.response);
                    console.log(res);
                    self.friends = [];
                    for (let friend in res) {
                        const friendNow = JSON.parse(res[friend]);
                        console.log(friendNow.userID2);
                        if (friendNow.userID2 === userID && friendNow.status === 'pending') {
                            friendNow.status = "asking";
                            self.friends.push(friendNow);
                            console.log('Me?? 🙃')
                        } else {
                            if (friendNow.userID2 === userID){
                                const temp = friendNow.userID2;
                                friendNow.userID2 = friendNow.userID1;
                                friendNow.userID1 = temp;
                            }
                            self.friends.push(friendNow);
                        }
                    }
                }
            }
        },
        addFriend(){
            const userID = localStorage.getItem("UserID");
            const auth = localStorage.getItem("Auth");
            var self = this;
            var data = new FormData();
            data.append("userId", userID);
            data.append("userAuth", auth);
            data.append("userEmail", self.addEmail);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "../api/add/friend.php");
            xhr.send(data);
            xhr.onreadystatechange = async function () {
                if (this.readyState === 4 && this.status === 200) {
                    self.checkFriends();
                }
            }
        },
        acceptFriend(id){
            const userID = localStorage.getItem("UserID");
            const auth = localStorage.getItem("Auth");
            var self = this;
            var data = new FormData();
            data.append("userId", userID);
            data.append("userAuth", auth);
            data.append("secUserId", id);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "../api/verify/friend.php");
            xhr.send(data);
            xhr.onreadystatechange = async function () {
                if (this.readyState === 4 && this.status === 200) {
                    self.checkFriends();
                }
            }
        },
        removeFriend(id){
            const userID = localStorage.getItem("UserID");
            const auth = localStorage.getItem("Auth");
            var self = this;
            var data = new FormData();
            data.append("userId", userID);
            data.append("userAuth", auth);
            data.append("secUserId", id);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "../api/remove/friend.php");
            xhr.send(data);
            xhr.onreadystatechange = async function () {
                if (this.readyState === 4 && this.status === 200) {
                    self.checkFriends();
                }
            }
        },
        async login() {
            if (this.dataSendLogin.password !== "" && this.dataSendLogin.email !== "") {
                var self = this;
                var data = new FormData();
                data.append("email", this.dataSendLogin.email)
                data.append("password", this.dataSendLogin.password);
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "../api/login/password.php");
                xhr.send(data);
                xhr.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        if (JSON.parse(this.response)["result"] !== "404: Error User not found") {
                            var antwort = JSON.parse(this.response);
                            console.log(antwort);
                            this.dataGet = antwort;
                            localStorage.setItem("Auth", antwort["Authentication"]);
                            localStorage.setItem("UserID", antwort["ID"]);
                            self.loaded();
                            self.loggedIn = true;
                            self.checkFriends();
                        }
                    }
                };
                this.dataSendLogin.password = "";
            }
        },
        async checkLogin(){
            if (event.keyCode === 13) {
                if (this.dataSendLogin.email !== '' && this.dataSendLogin.password) {
                    await this.login();
                }
            }
        },
        async register() {
            var self = this;
            var data = new FormData();
            data.append("email", this.dataSendRegister.email)
            data.append("password", this.dataSendRegister.password);
            data.append("username", this.dataSendRegister.username);
            data.append("pronouns", this.dataSendRegister.pronouns);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "../api/create/user.php");
            xhr.send(data);
            xhr.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    var antwort = JSON.parse(this.response);
                    console.log(antwort);
                    self.dataGet = antwort;
                    console.log(self.dataGet.Username);
                    localStorage.setItem("Auth", antwort["Auth"]);
                    localStorage.setItem("UserID", antwort["UserID"]);
                    self.loggedIn = true;
                    self.checkFriends();
                }
            };
        },
        setMovies(){
            var self = this;
            const userID = localStorage.getItem("UserID");
            const auth = localStorage.getItem("Auth");
            if (userID !== null && auth !== null) {
                var data = new FormData();
                data.append("userId", userID);
                data.append("userAuth", auth);
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "../api/get/listMovies.php");
                xhr.send(data);
                xhr.onreadystatechange = async function () {
                    if (this.readyState === 4 && this.status === 200) {
                        const response = JSON.parse(this.response);
                        console.log(response);
                        if (response["Status"] !== "Error") {
                            let movies = response["Result"];
                            console.log(movies);
                            for (let thing of movies) {
                                const movie = JSON.parse(thing);
                                if (movie["type"] === "Positive") {
                                    const responseFinalMovie = await fetch("https://api.themoviedb.org/3/" + movie['MediaType'] + "/" + movie["ID"] + "?api_key=de51817441f3aca4f2ec89ee99f6c68c&language=" + self.language)
                                    let thisMovie = await responseFinalMovie.json();
                                    thisMovie.poster_path = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2" + thisMovie["poster_path"];
                                    thisMovie.media_type = movie['MediaType'];
                                    self.listMoviesLiked.push(thisMovie);
                                } else {
                                    if (movie["type"] === "Negative") {
                                        const responseFinalMovie = await fetch("https://api.themoviedb.org/3/" + movie['MediaType'] + "/" + movie["ID"] + "?api_key=de51817441f3aca4f2ec89ee99f6c68c&language=" + self.language)
                                        let thisMovie = await responseFinalMovie.json();
                                        thisMovie.poster_path = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2" + thisMovie["poster_path"];
                                        thisMovie.media_type = movie['MediaType'];
                                        self.listMoviesDisliked.push(thisMovie);
                                    }
                                }
                            }
                            console.log(self.listMovies);
                        }
                    }
                };
            }
        },
        loaded() {
            var self = this;
            const userID = localStorage.getItem("UserID");
            const auth = localStorage.getItem("Auth");
            if (userID !== null && auth !== null) {
                var data = new FormData();
                data.append("userId", userID);
                data.append("userAuth", auth);
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "../api/get/user.php");
                xhr.send(data);
                xhr.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        console.log(JSON.parse(this.response)["Status"]);
                        if (JSON.parse(this.response)["Status"] !== "Error") {
                            var response = JSON.parse(this.response);
                            console.log(response);
                            if (response["Status"] !== "Error") {
                                let res = JSON.parse(response["Result"]);
                                res["Username"] = self.setCharAt(JSON.parse(response["Result"])["Username"], 0, JSON.parse(response["Result"])["Username"][0].toUpperCase());
                                self.dataGet = res;
                                self.loggedIn = true;
                                self.setMovies();
                                self.checkFriends();
                            }
                        } else {
                            self.loggedIn = false;
                            console.log("Not logged in");
                        }
                    }
                };
            }else{
                self.loggedIn = false;
            }
        }
    },
    created() {
        this.language = navigator.language;
        var self = this;
        self.loaded();
    }
});
