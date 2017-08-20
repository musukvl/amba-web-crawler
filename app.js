const AmbaCrawler = require('./AmbaCrawler');

const yargs = require('yargs');

let argv = yargs
    .describe('rootPageUrl', 'Root page url.')
    .demand(1, "Root page url required")
    .usage('Usage: $0 <rootPageUrl> [options]')
    .option('timeout',  { alias: "t", demand: false, default: 300000, describe: "request timeout in ms"})
    .option('interval', { alias: "i", demand: false, default: 250, describe: "interval between requests"})
    .option('maxDepth', { alias: "md", demand: false, default: 3, describe: "max crawling depth"})
    .option('maxConcurrency', { alias: "mc", demand: false, default: 5, describe: "max crawling threads count"})
    .help('h')
    .alias('h', 'help')
    .showHelpOnFail(true)
    .argv;

let siteUrl = argv._[0];
let crawlerOptions = {
    interval : argv.interval,
    maxConcurrency: argv.maxConcurrency,
    userAgent : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36",
    maxDepth: argv.maxDepth,
    timeout: argv.timeout,

    respectRobotsTxt: false,
    filterByDomain: false,
    scanSubdomains: true,

    sortQueryParameters: true,
    acceptCookies: true,
    //urlEncoding: "unicode",
    ignoreInvalidSSL: true
};

let extendedOptions = {

};

let crawler = new AmbaCrawler(siteUrl, crawlerOptions, extendedOptions);
crawler.start();

