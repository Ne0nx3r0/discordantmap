const Jimp = require('jimp');

const mapsToProcess = [
    'WesternGate2',
    'WesternGate2Loot',
];

mapsToProcess.forEach(function(mapName){
    processMap(mapName);
});

function processMap(mapToProcess:string){
    const jsonFile = '../assets/maps/'+mapToProcess+'.json';
    const mapInfo = require(jsonFile);

    const mapHeight = mapInfo.height;
    const mapWidth = mapInfo.width;
    const tileheight = mapInfo.tileheight;
    const tilewidth = mapInfo.tilewidth;

    let triggersLayer;

    for(var i=0;i<mapInfo.layers.length;i++){
        const layer = mapInfo.layers[i];

        if(layer.name == 'walls'){
            triggersLayer = i;
            break; 
        }
    }

    if(triggersLayer === undefined){
        throw 'No walls layer defined in map '+mapToProcess;
    }

    function isWalkable(x,y){
        return mapInfo.layers[triggersLayer].data[(y-1)*mapWidth+x-1] != 1;
    }

    const assetsToLoad = [
        './assets/hud_up.png',
        './assets/hud_down.png',
        './assets/hud_left.png',
        './assets/hud_right.png',
        './assets/hud_party.png',
        './assets/maps/'+mapToProcess+'.png',
    ];

    const assets = {};

    for(var i=0;i<assetsToLoad.length;i++){
        const asset = assetsToLoad[i];
        const assetName = asset.substr(asset.lastIndexOf('/')+1,asset.lastIndexOf('.')-asset.lastIndexOf('/')-1);

        Jimp.read(asset,function(err,lenna){
            if(err) throw err;

            assets[assetName] = lenna;

            if(Object.keys(assets).length == assetsToLoad.length){
                generateMapFiles();
            }
        });
    }

    const sliceSize = 9;

    function generateMapFiles(){
        //copy the json
        var fs = require('fs');
        var dir = './exports/';
        var subdir = './exports/'+mapToProcess+'/';
        var subdir2 = './exports/'+mapToProcess+'/slices/';

        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        if (!fs.existsSync(subdir)) fs.mkdirSync(subdir);
        if (!fs.existsSync(subdir2)) fs.mkdirSync(subdir2);

       fs.createReadStream('./assets/maps/'+mapToProcess+'.json').pipe(fs.createWriteStream(subdir+mapToProcess+'Layout.json'));

        for(var x=1;x<=mapWidth;x++){
            for(var y=1;y<=mapHeight;y++){
                if(!isWalkable(x,y)){
                    continue;
                }

                const image = assets[mapToProcess].clone();

                let overlayx = x;
                let overlayy = y;

                let cropx = x - (sliceSize-1)/2;
                let cropy = y - (sliceSize-1)/2;

                let cropw = x + (sliceSize-1)/2;
                let croph = y + (sliceSize-1)/2;

                while(cropx<1){
                    cropx++;
                    cropw++;
                    overlayx++;
                }

                while(cropy<1){
                    cropy++;
                    croph++;
                    overlayy++;
                }

                while(cropw>mapWidth){
                    cropx--;
                    cropw--;
                    overlayx--;
                }

                while(croph>mapHeight){
                    cropy--;
                    croph--;
                    overlayy--;
                }

                const compositeX = (x-cropx-1)*tilewidth;
                const compositeY = (y-cropy-1)*tileheight;

                image.crop(
                    (cropx-1)*tilewidth,
                    (cropy-1)*tileheight,
                    tilewidth*sliceSize,
                    tileheight*sliceSize
            )
                .composite(assets['hud_party'],compositeX,compositeY);

                //append directions party can walk from here
                if(isWalkable(x,y-1)) image.composite(assets['hud_up'],compositeX,compositeY);
                if(isWalkable(x-1,y)) image.composite(assets['hud_left'],compositeX,compositeY);
                if(isWalkable(x,y+1)) image.composite(assets['hud_down'],compositeX,compositeY);
                if(isWalkable(x+1,y)) image.composite(assets['hud_right'],compositeX,compositeY);

                image.write(subdir2+x+'-'+y+'.png');
            }
        }
    }    
}