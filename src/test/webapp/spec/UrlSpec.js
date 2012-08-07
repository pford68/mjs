describe("mjs.Url", function(){

    var $ = mjs;

    $.require("mjs/http/Url");

    var Url = $.http.Url;

    var urls = {
        simple: "http://www.pfc.com/",
        home: "https://jtts.pfc.com:8443/jtts-client/default.jsp",
        main: "https://jtts.pfc.com:8443/jtts-client/js/main/index.jsp",
        noPort: "http://jtts.pfc.com/jtts-client/js/main/index.jsp",
        missingPaths: "https://jtts.pfc.com:8443/core//trainingEvents///getAll",
        get: "https://jtts.pfc.com:8443/core/users/search?firstName=Tom&group=PFI&role=admin"
    };


    describe("Url()", function(){
        it("should parse simple urls with only protocols and hosts", function(){
            var loc = new Url(urls.simple);
            //$.log("simple").log(loc);
            expect("http").toEqual(loc.protocol);
            expect(loc.file).toBeNull();
            expect(loc.port).toBeNull();
            expect("www.pfc.com").toEqual(loc.hostname);
            expect(loc.context).toBeNull();
            expect(loc.pathinfo).toBeNull();
        });

        it("should parse urls without ports", function(){
            var loc = new Url(urls.noPort);
            //$.log("no port").log(loc);
            expect("http").toEqual(loc.protocol);
            expect(loc.port).toBeNull();
            expect("jtts.pfc.com").toEqual(loc.hostname);
            expect("index.jsp").toEqual(loc.file);
            expect("js/main").toEqual(loc.pathinfo);
            expect("jtts-client").toEqual(loc.context);
            expect(loc.query).toBeNull();
            expect(loc.search).toBeNull();
        });

        it("should parse urls with path info", function(){
            var loc = new Url(urls.main);
            //$.log("main + query").log(loc);
            expect("https").toEqual(loc.protocol);
            expect(8443).toEqual(loc.port);
            expect("jtts.pfc.com").toEqual(loc.hostname);
            expect("index.jsp").toEqual(loc.file);
            expect("js/main").toEqual(loc.pathinfo);
            expect("jtts-client").toEqual(loc.context);
            expect(loc.query).toBeNull();
            expect(loc.search).toBeNull();
        });

        it("should parse urls without path info", function(){
            var loc = new Url(urls.home);
            //$.log("no path info").log(loc);
            expect("https").toEqual(loc.protocol);
            expect(8443).toEqual(loc.port);
            expect("jtts.pfc.com").toEqual(loc.hostname);
            expect("default.jsp").toEqual(loc.file);
            expect(loc.pathinfo).toBeNull();
            expect("jtts-client").toEqual(loc.context);
            expect(loc.query).toBeNull();
            expect(loc.search).toBeNull();
        });

        it("should parse urls with query strings", function(){
            var loc = new Url(urls.main + "?startIndex=0&maxResults=40");
            //$.log("main + query").log(loc);
            expect("https").toEqual(loc.protocol);
            expect(8443).toEqual(loc.port);
            expect("jtts.pfc.com").toEqual(loc.hostname);
            expect("index.jsp").toEqual(loc.file);
            expect("js/main").toEqual(loc.pathinfo);
            expect("jtts-client").toEqual(loc.context);
            expect("startIndex=0&maxResults=40").toEqual(loc.query);
            expect("?startIndex=0&maxResults=40").toEqual(loc.search);
        });

        it("should parse the urls that contain multiple slashes", function(){
            var loc = new Url(urls.missingPaths);
            //$.log("missingPaths").log(loc);
            expect("https").toEqual(loc.protocol);
            expect(8443).toEqual(loc.port);
            expect("jtts.pfc.com").toEqual(loc.hostname);
            expect(loc.file).toBeNull();
            expect("trainingEvents/getAll").toEqual(loc.pathinfo);
            expect("core").toEqual(loc.context);
            expect(loc.query).toBeNull();
            expect(loc.search).toBeNull();
        });

        // Note:  this turns out to be exactly the same as above
        it("should parse the urls without file names", function(){
            var loc = new Url(urls.missingPaths);
            //$.log("missingPaths").log(loc);
            expect("https").toEqual(loc.protocol);
            expect(8443).toEqual(loc.port);
            expect("jtts.pfc.com").toEqual(loc.hostname);
            expect(loc.file).toBeNull();
            expect("trainingEvents/getAll").toEqual(loc.pathinfo);
            expect("core").toEqual(loc.context);
            expect(loc.query).toBeNull();
            expect(loc.search).toBeNull();
        });

        it("should be OK not to pass an argument", function(){
            try {
                new Url();
            } catch(e){
                this.fail("We should not reach this point.");
            }
        });
    });



    describe("instance methods", function(){

        describe("build()", function(){
            it("should construct a new url, replacing the existing parts with the supplied parts", function(){
                var url = new Url(urls.main).build({ file: "/casLogin.jsp" });
                expect("https://jtts.pfc.com:8443/jtts-client/js/main/casLogin.jsp").toEqual(url);

                url = new Url(urls.main).build({ port: 80, protocol: "ftp" });
                expect("ftp://jtts.pfc.com:80/jtts-client/js/main/index.jsp").toEqual(url);

                var url2 = new Url(urls.noPort).build({ protocol: "https", pathinfo: '', file: 'js/main/index.jsp' });
                expect("https://jtts.pfc.com/jtts-client/js/main/index.jsp").toEqual(url2);
            });
        });

        describe("parseQuery()", function(){
            it("should parse the querystring into a amp(object) of key/value pairs", function(){
                var params = new Url(urls.get).parseQuery();
                expect("Tom").toEqual(params.firstName);
                expect("PFI").toEqual(params.group);
                expect("admin").toEqual(params.role);
            });

            it("should parse the querystrings with missing parameters", function(){
                var params = new Url(urls.main + "?startIndex=&maxResults=40").parseQuery();
                expect("").toEqual(params.startIndex);
                expect("40").toEqual(params.maxResults);
            });
        });

        describe("getDomain()", function(){
            it("should return the portion of the url before the context, for use in postMessage()", function(){
                var url = new Url("http://jtts.pfc.com/jcms-client/js/main/casLogin.jsp");
                expect("http://jtts.pfc.com/").toEqual(url.getDomain());

                url = new Url("http://www.mydomain.com:9000/my-app/user/34");
                expect("http://www.mydomain.com:9000/").toEqual(url.getDomain());
            });
        })
    });


    describe("static methods", function(){
        describe("getQuery()", function(){
            it("should return the search portion of a url", function(){
                expect("firstName=Tom&group=PFI&role=admin").toEqual(Url.getQuery(urls.get));
            });
        });

        describe("parseQuery()", function(){
            it("should parse the querystring into a amp(object) of key/value pairs", function(){
                var params = Url.parseQuery(urls.get);
                expect("Tom").toEqual(params.firstName);
                expect("PFI").toEqual(params.group);
                expect("admin").toEqual(params.role);
            });


            it("should parse the querystrings with missing parameters", function(){
                var params = Url.parseQuery(urls.main + "?startIndex=&maxResults=40");
                expect("").toEqual(params.startIndex);
                expect("40").toEqual(params.maxResults);
            });
        });

    }) ;


});
