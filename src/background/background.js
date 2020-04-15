chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == "npmData") {
            var url = "https://api.npms.io/v2/package/" + request.itemId;
            fetch(url)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error));
            return true;  // Will respond asynchronously.
        }
    });

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-162460214-1']);
_gaq.push(['_trackPageview']);

(function () {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();