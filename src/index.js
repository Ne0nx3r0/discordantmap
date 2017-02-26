const mapToProcess = 'WesternGate';
const Jimp = require('jimp');
const mapInfo = require('../assets/maps/' + mapToProcess + '.json');
const mapHeight = mapInfo.height;
const mapWidth = mapInfo.width;
const tileheight = mapInfo.tileheight;
const tilewidth = mapInfo.tilewidth;
function isWalkable(x, y) {
    return mapInfo.layers[1].data[(y - 1) * mapWidth + x - 1] == 0;
}
const assetsToLoad = [
    './assets/hud_up.png',
    './assets/hud_down.png',
    './assets/hud_left.png',
    './assets/hud_right.png',
    './assets/hud_party.png',
    './assets/maps/' + mapToProcess + '.png',
];
const assets = {};
for (var i = 0; i < assetsToLoad.length; i++) {
    const asset = assetsToLoad[i];
    const assetName = asset.substr(asset.lastIndexOf('/') + 1, asset.lastIndexOf('.') - asset.lastIndexOf('/') - 1);
    Jimp.read(asset, function (err, lenna) {
        if (err)
            throw err;
        assets[assetName] = lenna;
        if (Object.keys(assets).length == assetsToLoad.length) {
            generateMapFiles();
        }
    });
}
const sliceSize = 9;
function generateMapFiles() {
    for (var x = 1; x <= mapWidth; x++) {
        for (var y = 1; y <= mapHeight; y++) {
            if (!isWalkable(x, y)) {
                continue;
            }
            const image = assets[mapToProcess].clone();
            let overlayx = x;
            let overlayy = y;
            let cropx = x - (sliceSize - 1) / 2;
            let cropy = y - (sliceSize - 1) / 2;
            let cropw = x + (sliceSize - 1) / 2;
            let croph = y + (sliceSize - 1) / 2;
            while (cropx < 1) {
                cropx++;
                cropw++;
                overlayx++;
            }
            while (cropy < 1) {
                cropy++;
                croph++;
                overlayy++;
            }
            while (cropw > mapWidth) {
                cropx--;
                cropw--;
                overlayx--;
            }
            while (croph > mapHeight) {
                cropy--;
                croph--;
                overlayy--;
            }
            const compositeX = (x - cropx - 1) * tilewidth;
            const compositeY = (y - cropy - 1) * tileheight;
            image.crop((cropx - 1) * tilewidth, (cropy - 1) * tileheight, tilewidth * sliceSize, tileheight * sliceSize)
                .composite(assets['hud_party'], compositeX, compositeY);
            //append directions party can walk from here
            if (isWalkable(x, y - 1))
                image.composite(assets['hud_up'], compositeX, compositeY);
            if (isWalkable(x - 1, y))
                image.composite(assets['hud_left'], compositeX, compositeY);
            if (isWalkable(x, y + 1))
                image.composite(assets['hud_down'], compositeX, compositeY);
            if (isWalkable(x + 1, y))
                image.composite(assets['hud_right'], compositeX, compositeY);
            image.write('./exports/' + x + '-' + y + '.png');
        }
    }
}
//# sourceMappingURL=index.js.map