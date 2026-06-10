const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'src', 'pages', 'Home.jsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

function cleanFileName(name) {
    return name.replace(/\s+/g, '-').replace(/[()]/g, '').toLowerCase();
}

function processDirectory(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (item.includes('WhatsApp Image')) {
            const cleanName = cleanFileName(item);
            const cleanPath = path.join(dir, cleanName);
            
            // Rename file
            fs.renameSync(fullPath, cleanPath);
            console.log(`Renamed: ${item} -> ${cleanName}`);
            
            // Replace exact literal string in Home.jsx
            // e.g. "WhatsApp Image 2026-05-25 at 4.50.46 PM (1).jpeg" becomes "whatsapp-image-..."
            homeContent = homeContent.split(item).join(cleanName);
        }
    }
}

const publicDir = path.join(__dirname, 'public', 'assets');
processDirectory(publicDir);

// Now handle the earrings specifically since they are already renamed physically but NOT in Home.jsx
const earringMap = [
    { old: 'WhatsApp Image 2026-05-25 at 5.17.00 PM.jpeg', new: 'earring-3.jpeg' },
    { old: 'WhatsApp Image 2026-05-25 at 5.17.00 PM (1).jpeg', new: 'earring-1.jpeg' },
    { old: 'WhatsApp Image 2026-05-25 at 5.17.00 PM (2).jpeg', new: 'earring-2.jpeg' },
    { old: 'WhatsApp Image 2026-05-25 at 5.17.01 PM.jpeg', new: 'earring-4.jpeg' }
];

for (const pair of earringMap) {
    homeContent = homeContent.split(pair.old).join(pair.new);
}

fs.writeFileSync(homePath, homeContent, 'utf8');
console.log("Updated Home.jsx with cleaned paths.");
