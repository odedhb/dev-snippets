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
            addStackOverflowData(result).catch(() => {
                addNpmData(result).catch(err => console.log(err));
            })
        })
    }
}

async function addStackOverflowData(result) {
    let response = await getContent(result, "stackoverflow.com/questions/(.*?)/", 'https://api.stackexchange.com/2.2/questions/', '/answers?&site=stackoverflow&filter=withbody&sort=votes');
    if (!response) throw ('next');
    let data = await response.json();
    let answer = "No answers";
    if (data.items.length) {
        answer = data.items[0].body;
        let score = data.items[0].score;
        result.innerHTML = result.innerHTML + `<div><img src="http://img.shields.io/badge/-${score}-blue.svg?label=score&color=F8752E&&style=for-the-badge&logo=data:image/png;base64,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"></img></div>`;
    }
    prepare(result, answer);
}

async function addNpmData(result) {
    let packageName = getPathPart(result, "npmjs.com/package/(.*)");
    if (!packageName) return;
    let readmeResponse = await runtimeMessage("npmData", packageName);
    let readmeData = readmeResponse.collected.metadata.readme;
    if (!readmeData) return;
    result.innerHTML = result.innerHTML + `<div><img src="https://img.shields.io/npm/dw/${packageName}.svg?style=for-the-badge&logo=npm"></img></div>`;
    let parsedMarkDown = marked(readmeData);
    prepare(result, parsedMarkDown);
}

async function addGitHubData(result) {
    let response = await getContent(result, "github.com/(.*)", 'https://raw.githubusercontent.com/', '/master/README.md');
    if (!response) throw ('next');
    let data = await response.text();

    let repoPath = 'request/request';
    result.innerHTML = result.innerHTML + `<div><img src="https://img.shields.io/github/last-commit/${repoPath}.svg?style=for-the-badge&logo=github"></img></div>`;

    let parsedMarkDown = marked(data);
    prepare(result, parsedMarkDown);
}

async function getContent(searchResult, regex, targetUriStart, targetUriEnd) {
    let part = getPathPart(searchResult, regex);
    if (!part) return null;
    let response = await fetch(targetUriStart + part + targetUriEnd);

    if (!response || response.status !== 200) {
        throw ('Looks like there was a ' + regex + ' problem. Status Code: ' + response.status);
    }

    return response;
}

function getPathPart(result, regex) {
    let id;
    try {
        let href = result.childNodes[0].href;
        let matches = href.match(regex);
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


async function runtimeMessage(contentScriptQuery, itemId) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { contentScriptQuery: contentScriptQuery, itemId: itemId },
            (json) => {
                if (!json) return reject();
                resolve(json);
            });
    });
}
