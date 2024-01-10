//this is my modification to the original JS

var resultList=[];//first list with codbar only

$(function() {
    
    //WARNING resultCollector va garder tous les resultats meme cceux qui seront supprimé de resultList
    var resultCollector = Quagga.ResultCollector.create({
        capture: true,
        capacity: 20,
        blacklist: [{
            code: "WIWV8ETQZ1", format: "code_93"
        }, {
            code: "EH3C-%GU23RK3", format: "code_93"
        }, {
            code: "O308SIHQOXN5SA/PJ", format: "code_93"
        }, {
            code: "DG7Q$TV8JQ/EN", format: "code_93"
        }, {
            code: "VOFD1DB5A.1F6QU", format: "code_93"
        }, {
            code: "4SO64P4X8 U4YUU1T-", format: "code_93"
        }],
        filter: function(codeResult) {
            // only store results which match this constraint
            // e.g.: codeResult
            if(codeResult === "") return false;
            if(codeResult === App.lastResult ) return false;//TODO TEST this
            
            let RESULTRET = true;
            
            if (resultList.length > 0){ 
                
                if ( CheckIfInList(codeResult.code))
                    RESULTRET = false;
                
                if (RESULTRET) {
                    
                    resultList.push(InitNewObj(codeResult.code));
                }    
            }
            else{   
                    resultList.push(InitNewObj(codeResult.code));   
            }
            
            return RESULTRET;
        }
    });
    var App = {
        init: function() {
            var self = this;

            Quagga.init(this.state, function(err) {
                if (err) {
                    return self.handleError(err);
                }
                //WARNING WAS Commented so try it :
                Quagga.registerResultCollector(resultCollector);
                App.attachListeners();
                App.checkCapabilities();
                Quagga.start();
            });
        },
        handleError: function(err) {
            console.log(err);
        },
        checkCapabilities: function() {
            var track = Quagga.CameraAccess.getActiveTrack();
            var capabilities = {};
            if (typeof track.getCapabilities === 'function') {
                capabilities = track.getCapabilities();
            }
            this.applySettingsVisibility('zoom', capabilities.zoom);
            this.applySettingsVisibility('torch', capabilities.torch);
        },
        updateOptionsForMediaRange: function(node, range) {
            console.log('updateOptionsForMediaRange', node, range);
            var NUM_STEPS = 6;
            var stepSize = (range.max - range.min) / NUM_STEPS;
            var option;
            var value;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            for (var i = 0; i <= NUM_STEPS; i++) {
                value = range.min + (stepSize * i);
                option = document.createElement('option');
                option.value = value;
                option.innerHTML = value;
                node.appendChild(option);
            }
        },
        applySettingsVisibility: function(setting, capability) {
            // depending on type of capability
            if (typeof capability === 'boolean') {
                var node = document.querySelector('input[name="settings_' + setting + '"]');
                if (node) {
                    node.parentNode.style.display = capability ? 'block' : 'none';
                }
                return;
            }
            if (window.MediaSettingsRange && capability instanceof window.MediaSettingsRange) {
                var node = document.querySelector('select[name="settings_' + setting + '"]');
                if (node) {
                    this.updateOptionsForMediaRange(node, capability);
                    node.parentNode.style.display = 'block';
                }
                return;
            }
        },
        initCameraSelection: function(){
            var streamLabel = Quagga.CameraAccess.getActiveStreamLabel();

            //NOTICE il revient par ici apres la seelction de la camera dans la liste ??!
            return Quagga.CameraAccess.enumerateVideoDevices()
            .then(function(devices) {
                function pruneText(text) {
                    return text.length > 30 ? text.substr(0, 30) : text;
                }
                var $deviceSelection = document.getElementById("deviceSelection");
                while ($deviceSelection.firstChild) {
                    $deviceSelection.removeChild($deviceSelection.firstChild);
                }
                devices.forEach(function(device) {
                    var $option = document.createElement("option");
                    $option.value = device.deviceId || device.id;
                    $option.appendChild(document.createTextNode(pruneText(device.label || device.deviceId || device.id)));
                    $option.selected = streamLabel === device.label;
                    $deviceSelection.appendChild($option);
                });
            });
        },
        attachListeners: function() {
            var self = this;

            self.initCameraSelection();
            
            $(".controls").on("click", "button.stop", function(e) {
                e.preventDefault();
                Quagga.stop();
                self._printCollectedResults();
                console.log("Add a list there");
                var $malisteplace = $("#result_strip ul.list");
                var $list = $('<li><h4>Liste finale</h4><div id="liste_finale"></div></li>');
                $malisteplace.prepend($list);
                var $main_div = $("#liste_finale");
                $main_div.prepend($(ReadList()));
                
            });

            $(".controls").on("click", "button.start", function(e) {
                e.preventDefault();
                App.init();
//                 Quagga.start();
            });
            

            $(".controls .reader-config-group").on("change", "input, select", function(e) {
                e.preventDefault();
                var $target = $(e.target),
                    value = $target.attr("type") === "checkbox" ? $target.prop("checked") : $target.val(),
                    name = $target.attr("name"),
                    state = self._convertNameToState(name);

                console.log("Value of "+ state + " changed to " + value);
                self.setState(state, value);
            });
        },
        _printCollectedResults: function() {
            //ca affiche tous les scans effectués selon le filtre du debut
            var results = resultCollector.getResults(),
                $ul = $("#result_strip ul.collector");

            results.forEach(function(result) {
                var $li = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h4 class="code"></h4></div></div></li>');

                $li.find("img").attr("src", result.frame);
                $li.find("h4.code").html(result.codeResult.code + " (" + result.codeResult.format + ")");
                $ul.prepend($li);
            });
        },
        _accessByPath: function(obj, path, val) {
            var parts = path.split('.'),
                depth = parts.length,
                setter = (typeof val !== "undefined") ? true : false;

            return parts.reduce(function(o, key, i) {
                if (setter && (i + 1) === depth) {
                    if (typeof o[key] === "object" && typeof val === "object") {
                        Object.assign(o[key], val);
                    } else {
                        o[key] = val;
                    }
                }
                return key in o ? o[key] : {};
            }, obj);
        },
        _convertNameToState: function(name) {
            return name.replace("_", ".").split("-").reduce(function(result, value) {
                return result + value.charAt(0).toUpperCase() + value.substring(1);
            });
        },
        detachListeners: function() {
            $(".controls").off("click", "button.stop");
            $(".controls .reader-config-group").off("change", "input, select");
        },
        applySetting: function(setting, value) {
            var track = Quagga.CameraAccess.getActiveTrack();
            if (track && typeof track.getCapabilities === 'function') {
                switch (setting) {
                case 'zoom':
                    return track.applyConstraints({advanced: [{zoom: parseFloat(value)}]});
                case 'torch':
                    return track.applyConstraints({advanced: [{torch: !!value}]});
                }
            }
        },
        setState: function(path, value) {
            var self = this;

            if (typeof self._accessByPath(self.inputMapper, path) === "function") {
                value = self._accessByPath(self.inputMapper, path)(value);
            }

            if (path.startsWith('settings.')) {
                var setting = path.substring(9);
                return self.applySetting(setting, value);
            }
            self._accessByPath(self.state, path, value);

            console.log(JSON.stringify(self.state));
            App.detachListeners();
            Quagga.stop();
            App.init();
        },
        inputMapper: {
            inputStream: {
                constraints: function(value){
                    if (/^(\d+)x(\d+)$/.test(value)) {
                        var values = value.split('x');
                        return {
                            width: {min: parseInt(values[0])},
                            height: {min: parseInt(values[1])}
                        };
                    }
                    return {
                        deviceId: value
                    };
                }
            },
            numOfWorkers: function(value) {
                return parseInt(value);
            },
            decoder: {
                readers: function(value) {
                    if (value === 'ean_extended') {
                        return [{
                            format: "ean_reader",
                            config: {
                                supplements: [
                                    'ean_5_reader', 'ean_2_reader'
                                ]
                            }
                        }];
                    }
                    return [{
                        format: value + "_reader",
                        config: {}
                    }];
                }
            }
        },
        state: {
            inputStream: {
                type : "LiveStream",
                constraints: {
                    width: {min: 640},
                    height: {min: 480},
                    facingMode: "environment",
                    aspectRatio: {min: 1, max: 2}
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            frequency: 10,
            decoder: {
                readers : [{
                    format: "code_128_reader",
                    config: {}
                }]
            },
            locate: true
        },
        lastResult : null
    };

    App.init();

    Quagga.onProcessed(function(result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
            }
        }
    });

    Quagga.onDetected(function(result) {
        var code = result.codeResult.code;

//         if (App.lastResult !== code) {
        if (CheckIfInLIList(code) === false){
            App.lastResult = code;
            var $node = null, canvas = Quagga.canvas.dom.image;
            //WARNING mon bouton est trop petit
            $node = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><button>Check</button><span size="8"></span> Q:<input id="ID_Q" onkeypress="return AddQ(this)" maxlength="4" size="4"><button onclick="return Del(this)">Del</button></div></div></li>');
            $node.find("img").attr("src", canvas.toDataURL());
            $node.find("span").html(" "+code);
            $node.find("input").attr("id", code);
            $node.find("button").attr("id", code);//WARNING pas top car on a 2 x le mm id !!
            $node.find("li").attr("class", "Main"+code);//WARNING MARCHE PAS
            $node.find("li").attr("id", "Main_"+code);// A TESTER !WARNING MARCHE PAS
            $node.find("div.thumbnail").attr("id", "Main_"+code);// A TESTER 
            $("#result_strip ul.thumbnails").prepend($node);
        }
    });

    
    
});

function AddQ(OBJ) {
    
    MODLIST(OBJ,"A");

}

function Del(OBJ) {
    
    MODLIST(OBJ,"D");

}

function MODLIST(OBJ, MODE) {
        
    //je ne comprends pas pourquoi mon objet disparaissait !
//     var MODOBJ = {...OBJ.id };// ou  OBJ.innerText Clonage avec spread de l'objet sinon on en perd la trace quand on l'enleve du tableau ! 
//     var testid = OBJ.id;//to test
    let data_li_idx = "";//WARNING should be init with "-1" and tested before used
    let data_c_idx = "";
    console.log("Add this value : "+OBJ.value+"to this barcode : "+OBJ.id +" or Del barcode");
    console.log(resultList);
    
    $.each(resultList, function(code_idx) {
                    
        if(resultList[code_idx].code === OBJ.id)
        {
           data_c_idx = code_idx;
            //TODO comment sortir d'un each qd on a trouvé ce qu'on veut ?
        }
    });
    
    if( MODE === "A" )
        resultList[data_c_idx].quantity = OBJ.value;
            
    if( MODE === "D" ){
        
        //enlever du tableau 
        resultList.splice(data_c_idx, 1);
        
        //il faut enlever aussi le node <li> entier grace à son 
        var $MyLi=document.getElementsByTagName("li");
        $.each($MyLi, function(li_idx) {
            
            //WARNING l'id envoyé ici etait pas le bon ! '
            if( $MyLi[li_idx].childNodes[0].id === ("Main_"+OBJ.id) )
            {
                data_li_idx = li_idx;
            }
            
        });
        
        $MyLi[data_li_idx].remove();
    }
            
}

//initialise un nouvel objet pour copie dans la liste "resultList"
//Donc permet d'ajouter de nouveau objet facilement comme un distributeur ou autre...
function InitNewObj(code) {
    
    TESTOBJ = new Object;
    TESTOBJ.code = code;
    TESTOBJ.quantity = "0";
    TESTOBJ.distributor = "nc";
    return TESTOBJ;
}

//Verifie si le code est dejà present dans la liste "resultList"
//return true si vrai
function CheckIfInList(code){
    let RET = false;
    $.each(resultList, function(code_idx) {
        if(resultList[code_idx].code === code)
        {
            RET = true;
        }
        
    });
    
    return RET;   
}

//Verifie si le code est dejà present dans la liste <li>
//return true si vrai
function CheckIfInLIList(code){
    let RET = false;
   
    var $MyLi=document.getElementsByTagName("li");
    $.each($MyLi, function(li_idx) {
        
        if( $MyLi[li_idx].childNodes[0].id === "Main_"+code)
        {
            RET = true;
        }
        
    });
    
    return RET;
}

//retourne la liste "resultList"

function ReadList(){
    let RET = "";
    $.each(resultList, function(code_idx) {
        RET = RET+"<p>"+resultList[code_idx].code+" Q: "+resultList[code_idx].quantity+" Dist: "+resultList[code_idx].distributor+"</p>";
        
    });
    
    return RET;   
}
