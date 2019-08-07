'use strict'

chrome.extension.sendMessage({}, intervalCheck);

function intervalCheck() {
    let readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            // ----------------------------------------------------------
            // This part of the script triggers when page is done loading
            getSearchResults();
        }
    }, 10);
}

function getSearchResults() {
    let htmlResults = document.getElementsByClassName("r");
    // console.log(htmlResults); //for debugging
    for (let result of htmlResults) {
        addGitHubData(result).catch(addNpmData(result)).catch(addStackOverflowData(result));
    }
}

function addStackOverflowData(result) {
    return getContent(result, "stackoverflow.com/questions/", "/", 'https://api.stackexchange.com/2.2/questions/', '/answers?&site=stackoverflow&filter=withbody&sort=votes', function (response) {
        if (!response) return false;
        response.json().then(function (data) {
            let snippet = "No answers";
            if (data.items.length) {
                snippet = data.items[0].body;
            }
            result.innerHTML = result.innerHTML + '<div  class="snippet" >' + snippet + '</div>';
            highlight(result);
        });
    });
}

async function addNpmData(result) {
    let response = await getContent(result, "npmjs.com/package/", '', 'https://api.npmjs.org/downloads/point/last-week/', '');
    if (!response) return false;
    response.json().then(function (data) {
        result.innerHTML = result.innerHTML + '<div class="snippet" style="font-size: large;">' + data.downloads.toLocaleString() + ' weekly downloads</div>';
    });
}

async function addGitHubData(result) {
    let response = await getContent(result, "github.com/", "", 'https://raw.githubusercontent.com/', '/master/README.md');
    let data = await response.text();
    let snippet = '<div class="snippet">';
    let matches = data.match(/```[\s\S]+?```/g);
    matches.forEach(match => {
        if (snippet.split(/\r\n|\r|\n/).length < 20) {
            match = match.replace(/```/g, '');
            snippet += '<pre>' + match + '</pre>';
        }
    });
    snippet += '</div>';
    result.innerHTML += snippet;
    highlight(result);
}

async function getContent(searchResult, sourceUriStart, sourceUriEnd, targetUriStart, targetUriEnd) {
    let part = getPathPart(searchResult, sourceUriStart, sourceUriEnd);
    if (!part) return null;

    let response = await fetch(targetUriStart + part + targetUriEnd).catch((err) => {
        console.log('Fetch Error :-S ' + sourceUriStart, err);
    });;

    if (!response || response.status !== 200) {
        console.log('Looks like there was a ' + sourceUriStart + ' problem. Status Code: ' + response.status);
        return null;
    }

    return response;
}

function getPathPart(result, start, end) {
    let id;
    try {
        let href = result.childNodes[0].href;
        let matches = href.match(start + "(.*)" + end);
        id = matches[1];
    } catch (e) {
        return null;
    }
    return id;
}

function highlight(block) {
    let children = block.querySelectorAll("*");
    children.forEach(element => {
        if (element.localName === 'pre' || element.localName === 'code') {
            hljs.highlightBlock(element);
        }
    });
}

