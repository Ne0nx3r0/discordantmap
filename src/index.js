var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Sharp = require('sharp');
const SLICE_SIZE = 9;
const fs = require('fs');
const args = process.argv.slice(2);
args.forEach(function (mapName) {
    processMap(mapName);
});
function processMap(mapToProcess) {
    const jsonFile = '../assets/maps/' + mapToProcess + '.json';
    const mapInfo = require(jsonFile);
    const mapHeight = mapInfo.height;
    const mapWidth = mapInfo.width;
    const tileheight = mapInfo.tileheight;
    const tilewidth = mapInfo.tilewidth;
    let pathLayer;
    for (var i = 0; i < mapInfo.layers.length; i++) {
        const layer = mapInfo.layers[i];
        if (layer.name == 'path') {
            pathLayer = i;
            break;
        }
    }
    if (pathLayer === undefined) {
        throw 'No path layer defined in map ' + mapToProcess;
    }
    function isWalkable(x, y) {
        return mapInfo.layers[pathLayer].data[(y - 1) * mapWidth + x - 1] == 1;
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
        assets[assetName] = fs.readFileSync(asset);
        if (Object.keys(assets).length == assetsToLoad.length) {
            generateMapSlices();
        }
    }
    function generateMapSlices() {
        return __awaiter(this, void 0, void 0, function* () {
            var dir = './exports/';
            var subdir = './exports/' + mapToProcess + '/';
            var subdir2 = './exports/' + mapToProcess + '/slices/';
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir);
            if (!fs.existsSync(subdir))
                fs.mkdirSync(subdir);
            if (!fs.existsSync(subdir2))
                fs.mkdirSync(subdir2);
            fs.createReadStream('./assets/maps/' + mapToProcess + '.json').pipe(fs.createWriteStream(subdir + mapToProcess + 'Layout.json'));
            const sharpImage = Sharp(assets[mapToProcess]);
            for (var x = 1; x <= mapWidth; x++) {
                for (var y = 1; y <= mapHeight; y++) {
                    if (!isWalkable(x, y)) {
                        continue;
                    }
                    let overlayx = x;
                    let overlayy = y;
                    let cropx = x - (SLICE_SIZE - 1) / 2;
                    let cropy = y - (SLICE_SIZE - 1) / 2;
                    let cropw = x + (SLICE_SIZE - 1) / 2;
                    let croph = y + (SLICE_SIZE - 1) / 2;
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
                    let image = sharpImage.clone();
                    const overlayOptions = {
                        top: compositeY,
                        left: compositeX,
                    };
                    console.log({
                        left: (cropx - 1) * tilewidth,
                        top: (cropy - 1) * tileheight,
                        width: tilewidth * SLICE_SIZE,
                        height: tileheight * SLICE_SIZE
                    });
                    image = yield image.extract({
                        left: (cropx - 1) * tilewidth,
                        top: (cropy - 1) * tileheight,
                        width: tilewidth * SLICE_SIZE,
                        height: tileheight * SLICE_SIZE
                    })
                        .raw().toBuffer();
                    const rawOptions = {
                        raw: {
                            width: tilewidth * SLICE_SIZE,
                            height: tileheight * SLICE_SIZE,
                            channels: 4,
                        }
                    };
                    image = yield Sharp(image, rawOptions)
                        .overlayWith(assets['hud_party'], overlayOptions).raw().toBuffer();
                    //append directions party can walk from here
                    if (isWalkable(x, y - 1))
                        image = yield Sharp(image, rawOptions).overlayWith(assets['hud_up'], overlayOptions).raw().toBuffer();
                    if (isWalkable(x - 1, y))
                        image = yield Sharp(image, rawOptions).overlayWith(assets['hud_left'], overlayOptions).raw().toBuffer();
                    if (isWalkable(x, y + 1))
                        image = yield Sharp(image, rawOptions).overlayWith(assets['hud_down'], overlayOptions).raw().toBuffer();
                    if (isWalkable(x + 1, y))
                        image = yield Sharp(image, rawOptions).overlayWith(assets['hud_right'], overlayOptions).raw().toBuffer();
                    Sharp(image, rawOptions).toFile(subdir2 + x + '-' + y + '.png');
                }
            }
        });
    }
}
//# sourceMappingURL=index.js.map