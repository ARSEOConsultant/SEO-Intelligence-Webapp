import Parser from 'rss-parser';
const parser = new Parser();
parser.parseURL('https://lilyraynyc.substack.com/feed').then(feed => {
  console.log(feed.items.map(i => ({title: i.title, date: i.pubDate, link: i.link})));
});
