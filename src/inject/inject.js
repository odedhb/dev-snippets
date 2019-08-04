chrome.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            // ----------------------------------------------------------
            // This part of the script triggers when page is done loading

            getSearchResults();


            function getSearchResults() {
                var htmlResults = document.getElementsByClassName("r");
                console.log(htmlResults); //for debugging
                for (var result of htmlResults) {
                    if (result.innerHTML.indexOf('npmjs.com/package/') != -1) {
                        getNpmData(result);
                    } else if (result.innerHTML.indexOf('stackoverflow.com/questions/') != -1) {
                        getStackOverflowData(result);
                    }
                }
            }

            function getStackOverflowData(result) {
                var questionID = result.childNodes[0].href.split('stackoverflow.com/questions/').pop().split('/')[0];;
                fetch('https://api.stackexchange.com/2.2/questions/' + questionID + '/answers?&site=stackoverflow&filter=withbody&sort=votes')
                    .then(
                        function (response) {
                            if (response.status !== 200) {
                                console.log('Looks like there was a getStackOverflowData problem. Status Code: ' +
                                    response.status);
                                return;
                            }

                            // Manipulate the text in the response
                            response.json().then(function (data) {
                                result.innerHTML = result.innerHTML + '<div style="border-style: solid;">' + data.items[0].body + '</div>';
                            });
                        }
                    )
                    .catch(function (err) {
                        console.log('Fetch Error :-S', err);
                    });
            }

            function getNpmData(result) {
                var packageName = result.childNodes[0].href.split('npmjs.com/package/').pop().split('"')[0];;
                fetch('https://api.npmjs.org/downloads/point/last-week/' + packageName)
                    .then(
                        function (response) {
                            if (response.status !== 200) {
                                console.log('Looks like there was a getNpmData problem. Status Code: ' +
                                    response.status);
                                return;
                            }

                            // Manipulate the text in the response
                            response.json().then(function (data) {
                                console.log(data);
                                result.innerHTML = result.innerHTML + '<span style="display: inline-block; text-decoration:none !important; color: dimgrey; font-size: small;">&nbsp-&nbsp' + data.downloads.toLocaleString() + ' weekly downloads</span>';
                            });
                        }
                    )
                    .catch(function (err) {
                        console.log('Fetch Error :-S', err);
                    });
            }


        }
    }, 10);
});