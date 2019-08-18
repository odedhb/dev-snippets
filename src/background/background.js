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