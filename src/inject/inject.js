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
        result.innerHTML = result.innerHTML + `<div><img src="http://img.shields.io/badge/-${score}-blue.svg?label=Answer%20Score&color=F8752E&&style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjIwIDEwIDgwIDkwIj48c3R5bGU+LnN0MHtmaWxsOiNiY2JiYmJ9LnN0MXtmaWxsOiNmNDgwMjN9PC9zdHlsZT48cGF0aCBjbGFzcz0ic3QwIiBkPSJNODQuNCA5My44VjcwLjZoNy43djMwLjlIMjIuNlY3MC42aDcuN3YyMy4yeiIvPjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0zOC44IDY4LjRsMzcuOCA3LjkgMS42LTcuNi0zNy44LTcuOS0xLjYgNy42em01LTE4bDM1IDE2LjMgMy4yLTctMzUtMTYuNC0zLjIgNy4xem05LjctMTcuMmwyOS43IDI0LjcgNC45LTUuOS0yOS43LTI0LjctNC45IDUuOXptMTkuMi0xOC4zbC02LjIgNC42IDIzIDMxIDYuMi00LjYtMjMtMzF6TTM4IDg2aDM4LjZ2LTcuN0gzOFY4NnoiLz48L3N2Zz4="></img></div>`;
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
