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
        if (result.nodeName !== 'DIV') continue;
        addGitHubData(result).catch(() => {
            addNpmData(result).catch(() => {
                addStackOverflowData(result).catch(err => console.log(err));
            })
        })
    }
}

async function addStackOverflowData(result) {
    let response = await getContent(result, "stackoverflow.com/questions/", "/", 'https://api.stackexchange.com/2.2/questions/', '/answers?&site=stackoverflow&filter=withbody&sort=votes');
    if (!response) throw ('next');
    let data = await response.json();
    let answer = "No answers";
    if (data.items.length) {
        answer = data.items[0].body;
    }
    prepare(result, answer);
}

async function addNpmData(result) {
    let response = await getContent(result, "npmjs.com/package/", '', 'https://api.npmjs.org/downloads/point/last-week/', '');
    if (!response) throw ('next');
    let data = await response.json();
    result.innerHTML = result.innerHTML + '<div class="snippet" style="font-size: large;">' + data.downloads.toLocaleString() + ' weekly downloads</div>';
}

async function addGitHubData(result) {
    let response = await getContent(result, "github.com/", "", 'https://raw.githubusercontent.com/', '/master/README.md');
    if (!response) throw ('next');
    let data = await response.text();
    let parsedMarkDown = marked(data);
    prepare(result, parsedMarkDown);
}

async function getContent(searchResult, sourceUriStart, sourceUriEnd, targetUriStart, targetUriEnd) {
    let part = getPathPart(searchResult, sourceUriStart, sourceUriEnd);
    if (!part) return null;
    let response = await fetch(targetUriStart + part + targetUriEnd);

    if (!response || response.status !== 200) {
        throw ('Looks like there was a ' + sourceUriStart + ' problem. Status Code: ' + response.status);
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

function prepare(result, snippet) {

    let wrappedSnippet = '<div class="snippet">' + snippet + '</div>';
    result.innerHTML += wrappedSnippet;

    let blocks = result.querySelectorAll("*");
    for (let element of blocks) {
        if (element.localName === 'pre' || element.localName === 'code') {
            hljs.highlightBlock(element);
        }
    }
}