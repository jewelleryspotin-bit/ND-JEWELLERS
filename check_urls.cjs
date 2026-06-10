const fs = require('fs');
const homeContent = fs.readFileSync('src/pages/Home.jsx', 'utf8');
const regex = /\/assets\/[A-Z]+\/[^"']+/g;
const urls = homeContent.match(regex);
const badUrls = [];
if (urls) {
    for (const url of new Set(urls)) {
        const filePath = 'public' + url;
        if (!fs.existsSync(filePath)) {
            badUrls.push(url);
        }
    }
}
console.log(badUrls.length > 0 ? 'Bad URLs: ' + badUrls.join(', ') : 'All URLs exist on disk.');
