const chalk = require('chalk');
const os = require("os");
const log = console.log;
const fs = require("fs");
const cheerio = require('cheerio');
const Crawler = require("simplecrawler");

class CustomCrawler {

    constructor(siteUrl, crawlerOptions, extendedOptions) {

        const crawler = Crawler(siteUrl);
        Object.assign(crawler, crawlerOptions);

        this._crawler = crawler;
        this._options = extendedOptions;
        this._crawler.discoverResources = this.discoverResources.bind(this)
        this._crawler.addFetchCondition(this.fetchCondition.bind(this));
        this._crawler.on("fetchcomplete", this.onFetchComplete.bind(this));
        this._crawler.on("fetch404", this.onFetchStateError.bind(this));
        this._crawler.on("fetch410", this.onFetchStateError.bind(this));
        this._crawler.on("fetcherror", this.onFetchStateError.bind(this));
        this._crawler.on("complete", this.onComplete.bind(this));
        this._crawler.on("fetchtimeout", this.onFetchTimeout.bind(this));
        this._pageReports = {};
        this._linkDescriptions = {};
    }

    onFetchTimeout(queueItem, crawlerTimeoutValue) {
        this.addItemToReport(queueItem, "TIMEOUT");
        log(chalk.red(`[TIMEOUT] (${queueItem.referrer})`));
    }

    discoverResources(buffer, queueItem){

        let $ = cheerio.load(buffer);

        let hrefs = $("*[href]").map((i, x) => {
            let $node = $(x);
            let value = $node.attr("href");
            let text = $node.text();
            if (text) {
                this._linkDescriptions[value] = text;
            }
            return value;
        }).get();

        let srcs = $("*[src]").map(function () {
            return $(this).attr("src");
        }).get();

        return [...hrefs, ...srcs];
    }

    fetchCondition(queueItem, referrerQueueItem, callback) {
        callback(null, referrerQueueItem.host === this._crawler.host);
    }

    onFetchStateError(queueItem, responseObject) {
        this.addItemToReport(queueItem, queueItem.stateData.code);
        log(chalk.red(`[${queueItem.stateData.code}] (${queueItem.referrer}) ${queueItem.url}`));
    }

    addItemToReport(queueItem, label, details = "") {
        let pageReport = this._pageReports[queueItem.referrer];
        if (!pageReport) {
            this._pageReports[queueItem.referrer] = [];
        }
        let record = {
            url: queueItem.url,
            label: label,
            details: details
        };
        if (!label) {
            record.label = queueItem.stateData.code;
        }
        if (!details && this._linkDescriptions[queueItem.url]) {
            record.details = "Link text: " + this._linkDescriptions[queueItem.url];
        }
        this._pageReports[queueItem.referrer].push(record);
    }

    onFetchComplete(queueItem, responseBuffer, response) {
        log(chalk.green(`[${queueItem.stateData.code}] ${queueItem.url}`));
    }

    onComplete() {
        this.writeReport();
        log(`Done`);
    }

    start(){
        this._crawler.start();
    }

    writeReport() {
        let report = "";
        Object.keys(this._pageReports).forEach(referer => {
            let pageReport = this._pageReports[referer];

            report += `${referer}: ${os.EOL}`;
            for(let item of pageReport) {
                report += `  [${item.label}] ${item.url} ${item.details} ${os.EOL}`
            }
            report += `${os.EOL}`;
        });
        fs.writeFileSync(`${this._crawler.host}.txt`, report);
    }
}

module.exports = CustomCrawler;