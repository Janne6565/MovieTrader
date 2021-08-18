Vue.component('dropdown-list', {
    data: function () {
        return {
            items: [],
            test: "Test",
            search: "",
            displayedItems: {},
            stringOut: "",
        }
    },
    props: ['items', 'name', 'valueTo', 'userID', 'userAuth', 'stringOut'],
    template: `
      <div :class="'dropdown '+ 'dropdown' + name">
        <div class="labelDropdown" :id="'dropdownLabel'+ name">{{name}}</div>
        <div class="listDropdown">
          <input type="text" v-model="search" v-on:change="" placeholder="Search">
          <span v-for="item in displayedItems">
            <input v-on:change="updated()" v-model="item.value" type="checkbox" class="checkbox" :id="item.id">
            <label :for="item.id" class="labelCheckbox">{{item.name}}</label> 
          </span>
        </div>
      </div>   
    `,
    computed: {
        get() {
            return this.stringOut;
        },
        set(val) {
            this.$emit(this.stringOut, val);
        },
    },
    watch: {
        'search': function() {
            if (this.items !== undefined && this.items !== "") {
                this.displayedItems = this.items.filter(item => item.name.toLowerCase().includes(this.search.toLowerCase()));
                this.displayedItems = this.displayedItems.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
            }
        },
        'items': function() {
            this.displayedItems = this.items
            this.displayedItems.filter(item => item.name.toLowerCase().includes(this.search.toLowerCase()));
        },
        'displayedItems': function() {
        }
    },
    methods: {
        updated(){

        }
    },
    async created() {
        if (this.items !== undefined && this.items !== "") {
            console.log(this.items);
            this.displayedItems = this.items.filter(item => item.name.toLowerCase().includes(this.search.toLowerCase()));
            this.displayedItems = this.displayedItems.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        }
    }
})

new Vue({
    el: '#app',
    data: function () {
        return {
            genres: "",
            providers: "",
            language: "",
            loggedIn: false,
            genresOut: "lol",
            userID: "",
            userAuth: "",
        }
    },
    methods: {
        makeUpdate(selectorWith, selectorWithout, value){
            if (selectorWith !== null) {
                let stringWith = "";
                for (let item in value) {
                    if (value[item].value === true) {
                        stringWith += value[item].id + ",";
                    }
                }
                this.update(selectorWith, stringWith);
            }

            if (selectorWithout !== null) {
                let StringWithout = "";
                for (let item in value) {
                    if (value[item].value === false) {
                        StringWithout += value[item].id + ",";
                    }
                }
                this.update(selectorWithout, StringWithout);
            }
        },
        update(selector, value){
            let formData = new FormData();
            formData.append('selector', selector);
            formData.append('value', value);
            formData.append('userId', this.userID);
            formData.append('userAuth', this.userAuth);
            let xhr = new XMLHttpRequest();
            xhr.open('POST', '../api/set/filter.php');
            xhr.send(formData);
            xhr.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    console.log("Filter Sucessully set: " + selector + ": " + value);
                }
            }
        }
    },
    watch: {
        genres: {
            deep: true,
            handler() {
                this.makeUpdate("with_genres", "without_genres", this.genres);
            }
        },
        providers: {
            deep: true,
            handler() {
                this.makeUpdate("with_watch_providers", null, this.providers);
            }
        }
    },
    async created() {
        this.language = navigator.language;
        this.country = this.language[3] + this.language[4];
        let genres = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=de51817441f3aca4f2ec89ee99f6c68c&language=${this.language}`);
        let genresRes = await genres.json();
        let finalGenres = genresRes.genres;
        for (let item in finalGenres) {
            finalGenres[item].value = false;
        }
        this.genres = await finalGenres;
        
        let providers = await fetch(`https://api.themoviedb.org/3//watch/providers/movie?api_key=de51817441f3aca4f2ec89ee99f6c68c&language=${this.language}&watch_region=${this.country}`);
        let providersRes = await providers.json();
        console.log(providersRes);
        let finalProv = [];
        for (let item in providersRes.results) {
            finalProv.push({
                'id': providersRes.results[item].provider_id,
                'name': providersRes.results[item].provider_name,
                'value': false,
            })
        }
        console.log(finalProv);
        this.providers = await finalProv;

        var self = this;
        // Login
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
                    if (JSON.parse(this.response) !== {"Status": "Error"}) {
                        self.loggedIn = true;
                        self.userID = userID;
                        self.userAuth = auth;
                        var antwort = JSON.parse(this.response);
                        var dataNew = new FormData();
                        dataNew.append("userId", userID);
                        dataNew.append("userAuth", auth);
                        var xhrNew = new XMLHttpRequest();
                        xhrNew.open("POST", "../api/get/filters.php");
                        xhrNew.send(data);
                        xhrNew.onreadystatechange = function () {
                            if (this.readyState === 4 && this.status === 200) {
                                const response = JSON.parse(this.response);
                                console.log(response);
                                for (let item in response){
                                    let res = JSON.parse(response[item]);
                                    if (res.Selector === "with_genres"){
                                        for (let idPart in res.Value.split(',')){
                                            let id = res.Value.split(',')[idPart];
                                            console.log(id);
                                            for (let genre in self.genres) {
                                                if (self.genres[genre].id.toString() === id) {
                                                    console.log("Set " + id + " true");
                                                    self.genres[genre].value = true;
                                                }
                                            }
                                        }
                                    }
                                    if (res.Selector === "with_watch_providers"){
                                        for (let idPart in res.Value.split(',')){
                                            let id = res.Value.split(',')[idPart];
                                            for (let prov in self.providers){
                                                if (self.providers[prov].id.toString() === id){
                                                    self.providers[prov].value = true;
                                                    console.log("Set prov " + id + " true");
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    self.loggedIn = false;
                }
            };
        }else{
            self.loggedIn = false;
        }
    }
});