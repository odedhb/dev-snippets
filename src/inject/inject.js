chrome.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            // ----------------------------------------------------------
            // This part of the script triggers when page is done loading

            getSearchResults();


            function getSearchResults() {
                var htmlResults = document.getElementsByClassName("LC20lb");
                console.log(htmlResults);
                for (var result of htmlResults) {
                    if (result.innerText.indexOf(' - npm') != -1) {
                        getPackageData(result);
                    }
                }
            }

            function getPackageData(result) {
                var packageName = result.innerText.replace(' - npm', '');
                fetch('https://api.npmjs.org/downloads/point/last-week/' + packageName)
                    .then(
                        function (response) {
                            if (response.status !== 200) {
                                console.log('Looks like there was a problem. Status Code: ' +
                                    response.status);
                                return;
                            }

                            // Examine the text in the response
                            response.json().then(function (data) {
                                injectStats(result, data);
                            });
                        }
                    )
                    .catch(function (err) {
                        console.log('Fetch Error :-S', err);
                    });

                // ----------------------------------------------------------

            }

            function injectStats(result, data) {
                // result.innerText = result.innerText + ' (' + data.downloads.toLocaleString() + ' weekly downloads)';


                result.innerHTML = result.innerHTML + '<span style="display: inline-block; text-decoration:none !important; color: dimgrey; font-size: small;">&nbsp-&nbsp' + data.downloads.toLocaleString() + ' weekly downloads</span>';
            }

        }
    }, 10);
});