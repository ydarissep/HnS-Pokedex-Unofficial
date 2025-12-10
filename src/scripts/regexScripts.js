async function regexScripts(textScripts, tradeText, specialFunctions){
    const tradeArray = tradeText.match(/INGAME_TRADE_\w+.*?.species.*?SPECIES_\w+/igs)
    const regexSpecialFunctions = new RegExp(Object.keys(specialFunctions).toString().replaceAll(",", "|"), "g")

    let ignoreHoenn = true
    const matchScripts = textScripts.match(/data\/.*.inc/ig)
    let scripts = []
    matchScripts.forEach(scriptPath => {
        if (scriptPath == "data/maps/Route29/scripts.inc"){
            ignoreHoenn = false
        }
        if (!ignoreHoenn){
            scripts.push(scriptPath)
        }
    })

    scripts.push("data/event_scripts.s")
    for(let i = 0, j = scripts.length; i < j; i++){
        fetch(`https://raw.githubusercontent.com/${repo}/${scripts[i]}`)
        .then(promises => {
            promises.text()
            .then(text => {
                regexScript(text, scripts[i], tradeArray, specialFunctions, regexSpecialFunctions)
            })
        })
    }
}







async function getTrainersSpriteConversionTable(textFrontPicTables, textGraphicsTrainers){
    let tempTrainersSpriteConversionTable = {}
    textFrontPicTables.match(/TRAINER_SPRITE\s*\(\w+\s*,\s*gTrainerFrontPic\w+/ig).forEach(trainerSprite => {
        const matchTrainerSprite = trainerSprite.match(/TRAINER_SPRITE\s*\((\w+)\s*,\s*(gTrainerFrontPic\w+)/i)
        tempTrainersSpriteConversionTable[matchTrainerSprite[2]] = `TRAINER_PIC_${matchTrainerSprite[1]}`
    })

    let trainersSpriteConversionTable = {}
    textGraphicsTrainers.match(/gTrainerFrontPic\w+.*?graphics\/trainers\/front_pics.*?\./ig).forEach(trainerFrontSprite => {
        const matchTrainerFrontSprite = trainerFrontSprite.match(/(gTrainerFrontPic\w+).*?(graphics\/trainers\/front_pics.*?\.)/i)
        trainersSpriteConversionTable[tempTrainersSpriteConversionTable[matchTrainerFrontSprite[1]]] = `${matchTrainerFrontSprite[2]}png`
    })

    return trainersSpriteConversionTable
}








async function regexTrainers(textTrainers, trainersSpriteConversionTable){
    const lines = textTrainers.split("\n")
    let comment = false, trainer = null, zone = null, conversionTable = {}, trainerToZone = {}

    Object.keys(trainers).forEach(zone => {
        Object.keys(trainers[zone]).forEach(trainer => {
            trainerToZone[trainer] = zone
        })
    })

    /*
    const rawRematch = await fetch(`https://raw.githubusercontent.com/${repo}/src/battle_setup.c`)
    const textRematch = await rawRematch.text()

    let trainerToRematch = {}
    const rematches = textRematch.match(/REMATCH\(TRAINER_\w+, TRAINER_\w+, TRAINER_\w+, TRAINER_\w+/ig)
    rematches.forEach(rematch => {
        const trainerMatch = rematch.match(/TRAINER_\w+/ig)
        for(let i = 1; i < trainerMatch.length; i++){
            if(trainerMatch[i] !== trainerMatch[0]){
                trainerToRematch[trainerMatch[i]] = trainerMatch[0]
            }
        }
    })
    */

    lines.forEach(line => {
        line = line.trim()
        if(/\/\*/.test(line)){
            comment = true
        }
        if(/\*\//.test(line)){
            comment = false
        }
        
        if(!comment && !/^\/\//.test(line)){
            if(/\[ *TRAINER_\w+ *\]/i.test(line)){
                trainer = line.match(/TRAINER_\w+/i)[0]
                zone = trainerToZone[trainer]
                /*
                if(trainerToRematch[trainer]){
                    const rematch = trainerToRematch[trainer]
                    if(!zone){
                        zone = trainerToZone[rematch]
                    }
                    if(trainer && zone && rematch){
                        if(!trainers[zone][rematch]["rematchArray"]){
                            trainers[zone][rematch]["rematchArray"] = []
                        }
                        try{
                            trainers[zone][trainer]["rematch"] = rematch
                        }
                        catch{
                            trainers[zone][trainer] = {}
                            initTrainer(trainers, trainer, zone)
                            trainers[zone][trainer]["rematch"] = rematch
                            trainerToZone[trainer] = zone
                        }
                        trainers[zone][rematch]["rematchArray"].push(trainer)
                    }
                }
                */
            }
            if(zone && trainers[zone][trainer]){
                if(/.trainerPic *=/i.test(line)){
                    const matchTrainerPic = line.match(/TRAINER_PIC_\w+/i)
                    if(matchTrainerPic){
                        trainers[zone][trainer]["sprite"] = trainersSpriteConversionTable[matchTrainerPic[0]]
                    }
                }
                else if(/.trainerName *=/i.test(line)){
                    const matchTrainerName = line.match(/_\(\"(.*)\"\)/i)
                    if(matchTrainerName){
                        if (/rival_name|\?\?\?/i.test(matchTrainerName[1])){
                            trainers[zone][trainer]["ingameName"] = "Rival"
                        }
                        else{
                            trainers[zone][trainer]["ingameName"] = sanitizeString(matchTrainerName[1])
                        }
                    }
                }
                else if(/.doubleBattle *=/i.test(line)){
                    if(/TRUE *,/i.test(line)){
                        trainers[zone][trainer]["double"] = true
                    }
                }
                else if(/.party *=/i.test(line)){
                    const matchParty = line.match(/sParty_\w+/i)
                    if(matchParty){
                        conversionTable[matchParty[0]] = trainer
                    }
                }
                else if(/^} *,$/.test(line)){
                    trainer = null
                    zone = null
                }
            }
        }

    })

    return [conversionTable, trainerToZone]
}



async function regexTrainersParties(textTrainersParties, [conversionTable, trainerToZone]){
    const lines = textTrainersParties.split("\n")
    let comment = false, trainer = null, zone = null, difficulty = "Normal", mon = {}   

    lines.forEach(line => {
        line = line.trim()

        if(/\/\*/.test(line) || line === "/*"){
            comment = true
        }
        if(/[^\/]\*\//.test(line) || line === "*/"){
            comment = false
        }
        
        if(!comment && !/^\/\//.test(line)){
            if(/sParty_\w+/i.test(line)){
                const party = line.match(/sParty_\w+/)[0]
                if(conversionTable[party]){
                    trainer = conversionTable[party]
                    zone = trainerToZone[trainer]
                }
            }
            if(zone && trainers[zone][trainer]){
                if(/.lvl *=/i.test(line)){
                    const matchLvl = line.match(/\d+/)
                    if(matchLvl){
                        mon["lvl"] = matchLvl[0]
                    }
                }
                else if(/.species *=/i.test(line)){
                    const matchSpecies = line.match(/SPECIES_\w+/i)
                    if(matchSpecies){
                        mon["name"] = matchSpecies[0]
                    }
                }
                else if(/.heldItem *=/i.test(line)){
                    const matchItem = line.match(/ITEM_\w+/i)
                    if(matchItem){
                        mon["item"] = matchItem[0]
                    }
                }
                else if(/.ability *=/i.test(line)){
                    const matchAbility = line.match(/\d+/)
                    if(matchAbility){
                        mon["ability"] = matchAbility[0]
                    }
                }
                else if(/.moves *=/i.test(line)){
                    const matchMoves = line.match(/MOVE_\w+/ig)
                    if(matchMoves){
                        mon["moves"] = matchMoves
                    }
                }
                else if(/.iv *=/i.test(line)){
                    const matchIVs = line.match(/\d+/)
                    if(matchIVs){
                        const IVs = Math.floor(matchIVs[0] * 31 / 255)
                        mon["ivs"] = [IVs, IVs, IVs, IVs, IVs, IVs]
                    }
                }
                else if(/^} *,?$/.test(line)){
                    if(mon["lvl"] && mon["name"]){ 
                        if(!mon["item"]){
                            mon["item"] = "ITEM_NONE"
                        }
                        if(!mon["ability"]){
                            mon["ability"] = 0
                        }
                        if(!mon["ivs"]){
                            mon["ivs"] = [0]
                        }
                        if(!mon["evs"]){
                            mon["evs"] = [0]
                        }
                        if(!mon["nature"]){
                            mon["nature"] = "NATURE_DOCILE"
                        }
                        if(!mon["moves"]){
                            mon["moves"] = getWildPokemonLearnsets(mon["name"], mon["lvl"])
                        }
                        if(!trainers[zone][trainer]["party"][difficulty]){
                            trainers[zone][trainer]["party"][difficulty] = []
                        }
                        trainers[zone][trainer]["party"][difficulty].push(mon)
                    }
                    mon = {}
                }
                else if(/^} *;$/.test(line)){
                    Object.keys(trainers[zone][trainer]["party"]).forEach(difficulty => {
                        trainers[zone][trainer]["party"][difficulty].forEach(trainerSpeciesObj => {
                            let speciesName = trainerSpeciesObj["name"]
                            for(let i = 0; i < species[speciesName]["evolution"].length; i++){
                                if(species[speciesName]["evolution"][i][0].includes("EVO_MEGA") && species[speciesName]["evolution"][i][1] == trainerSpeciesObj["item"]){
                                    trainerSpeciesObj["name"] = species[speciesName]["evolution"][i][2]
                                }
                            }
                        })
                    })
                    
                    trainer = null
                    zone = null
                    difficulty = "Normal"
                }
            }
        }
    })
}






function getWildPokemonLearnsets(name, lvl){
    let validMoves = []
    let moves = []

    for(let i = 0, j = species[name]["levelUpLearnsets"].length; i < j; i++){
        if(species[name]["levelUpLearnsets"][i][1] > lvl){
            break
        }
        validMoves.push(species[name]["levelUpLearnsets"][i][0])
    }

    for(let i = validMoves.length, j = 0; i > 0 && j < 4; i--, j++){
        if(!moves.includes(validMoves[i - 1])){
            moves.push(validMoves[i - 1])
        }
    }

    return moves
}








async function regexItems(textItems){
    const lines = textItems.split("\n")
    const regex = /.name|.description|.holdEffectParam|.price|.pocket/i
    let item = null, conversionTable = {}

    lines.forEach(line => {
        const regexMatch = line.match(regex)
        if(/\[\s*ITEM_\w+\s*\]/.test(line)){
            item = line.match(/\[\s*(ITEM_\w+)\s*\]/)[1]
            initItem(item)
        }
        else if(regexMatch){
            const match = regexMatch[0]
            if(match === ".name"){
                items[item]["ingameName"] = sanitizeString(line.match(/_\("(.*)"\)/)[1])
            }
            else if(match === ".description"){
                const descMatch = line.match(/s\w+Desc/i)
                if(descMatch){
                    const desc = descMatch[0]
                    if(!(desc in conversionTable)){
                        conversionTable[desc] = [item]
                    }
                    else{
                        conversionTable[desc].push(item)
                    }
                }
            }
            else if(match === ".holdEffectParam"){
                items[item]["effect"] = line.match(/=\s*(.*)\s*,/)[1]
            }
            else if(match === ".price"){
                items[item]["price"] = line.match(/\d+/)[0]
            }
            else if(match === ".pocket"){
                items[item]["pocket"] = line.match(/POCKET_\w+/)[0]
            }
        }
    })

    return conversionTable
}







async function regexItemDescriptions(textItemDescriptions, conversionTable){
    const lines = textItemDescriptions.split("\n")
    let desc = null, description = ""

    lines.forEach(line => {
        const descMatch = line.match(/s\w+Desc/i)
        if(descMatch){
            desc = descMatch[0]
        }
        else if(/".*"/.test(line)){
            description += line.match(/"(.*)"/)[1].replaceAll("-\\n", "").replaceAll("\\n", " ")
        }

        if(/"\s*\)\s*;/.test(line) && conversionTable[desc]){
            conversionTable[desc].forEach(item => {
                items[item]["description"] = description
            })

            desc = null
            description = ""
        }
    })
}











async function regexSpecialsFunctions(textSpecials){
    const lines = textSpecials.split("\n")
    let functionName = null
    let functions = {}
    let counter = 0

    lines.forEach(line => {
        line = line.trim()
        const functionNameMatch = line.match(/^(?:u\d+|s\d+|bool\d+|void)\s*(\w+)\s*\(.*\)$/i)
        if(functionNameMatch){
            functionName = functionNameMatch[1]
            counter = 0
        }
        else if(functionName){
            const speciesMatch = line.match(/SPECIES_\w+/g)
            if(speciesMatch){
                speciesMatch.forEach(speciesName => {
                    if(speciesName != "SPECIES_NONE" && speciesName != "SPECIES_EGG" && speciesName != "SPECIES_ZIGZAGOON"){
                        if(!(functionName in functions)){
                            functions[functionName] = []
                        }
                        if(!functions[functionName].includes(speciesName)){
                            functions[functionName].push(speciesName)
                        }
                    }
                })
            }
        }
        if(line.includes("{")){
            counter++
        }
        if(line.includes("}")){
            counter--
            if(counter <= 0){
                functionName = null
            }
        }
    })

    return functions
}







async function regexItemIcon(textItemIconTable, textItemsIcon){
    let iconToItem = {}

    textItemIconTable.match(/ITEM_\w+\s*\].*gItemIcon_\w+ *,/ig).forEach(iconMatch => {
        const itemName = iconMatch.match(/(ITEM_\w+)\s*\]/i)[1]
        const itemIcon = iconMatch.match(/\].*(gItemIcon_\w+)/)[1]

        if(!iconToItem[itemIcon]){
            iconToItem[itemIcon] = []
        }

        iconToItem[itemIcon].push(itemName)
    })
    
    textItemsIcon.match(/gItemIcon_\w+.*?\./ig).forEach(pathMatch => {
        const itemIcon = pathMatch.match(/gItemIcon_\w+/)[0]
        const itemPath = `${pathMatch.match(/"(.*?)\./)[1]}.png`

        if(iconToItem[itemIcon]){
            iconToItem[itemIcon].forEach(itemName => {
                if(itemName in items){
                    items[itemName]["url"] = `https://raw.githubusercontent.com/${repo}/${itemPath}`
                }
           })
        }
    })

    Object.keys(items).forEach(itemName => {
        if(items[itemName]["url"] === ""){
            const move = itemName.replace(/ITEM_TM|ITEM_HM/, "MOVE")
            if(move in moves){
                let type = moves[move]["type"]
                if (type == "TYPE_MYSTERY"){
                    type = "TYPE_NORMAL"
                }
                items[itemName]["url"] = `https://raw.githubusercontent.com/ydarissep/dex-core/main/sprites/TM_${type}.png`
            }
        }
    })
}







async function getHeldItems(){
    Object.keys(species).forEach(speciesName => {
        if(species[speciesName]["item1"] != ""){
            if(!("Held" in items[species[speciesName]["item1"]]["locations"])){
                items[species[speciesName]["item1"]]["locations"]["Held"] = ["Held by wild Pokemon"]
            }
        }
        if(species[speciesName]["item2"] != ""){
            if(!("Held" in items[species[speciesName]["item2"]]["locations"])){
                items[species[speciesName]["item2"]]["locations"]["Held"] = ["Held by wild Pokemon"]
            }
        }
    })
}








async function regexHiddenItems(textFlags){
    const itemsKey = JSON.stringify(Object.keys(items))

    textFlags.match(/FLAG_.*FLAG_HIDDEN_ITEMS_START/g).forEach(flagMatch => {
        const flag = flagMatch.match(/FLAG_\w+/)[0]
        const itemNameArray = flag.replace(/FLAG_(?:HIDDEN_ITEM_)?/, "").split("_")

        regexLoop: for(let i = 0; i < itemNameArray.length; i++){
            let itemName = itemNameArray.slice(i, itemNameArray.length).join("_")

            const regex = [
            new RegExp(`"(ITEM_${itemName})"`, "i"), 
            new RegExp(`"(ITEM_${itemName.replace(/_?\d+$/, "")})"`, "i"), 
            new RegExp(`"(ITEM_\\w*${itemName.replaceAll("_", "")}\\w*)"`, "i"), 
            new RegExp(`"(ITEM_\\w*${itemName}\\w*)"`, "i"), 
            new RegExp(`"(ITEM_\\w*${itemName.replace(/_?\d+$/, "")}\\w*)"`, "i")]

            for(let j = 0; j < regex.length; j++){
                const itemNameMatch = itemsKey.match(regex[j])
                if(itemNameMatch){
                    itemName = itemNameMatch[1]
    
                    let zone = itemNameArray.slice(0, i).join(" ")
                    if(zone === ""){
                        zone = "Unknown"
                    }
    
                    if(!items[itemName]["locations"]["Hidden"]){
                        items[itemName]["locations"]["Hidden"] = []
                    }
                    items[itemName]["locations"]["Hidden"].push(sanitizeString(zone))
                    break regexLoop
                }
            }
        }
    })
}








async function regexTutorItems(textTutor){
    const lines = textTutor.split("\n")
    let scriptName = null, moveArray = [], zone = null

    lines.forEach(line => {
        line = line.trim()

        if(/::/.test(line)){
            scriptName = line
        }
        else if(/^\s*end\s*$/i.test(line)){
            if(scriptName && moveArray.length > 0 && zone){
                for(let i = 0; i < moveArray.length; i++){
                    const move = moveArray[i]
                    const tutorName = move.replace("MOVE_", "ITEM_TUTOR_")
                    initItem(tutorName)
                    if(!items[tutorName]["locations"]["Tutor"]){
                        items[tutorName]["locations"]["Tutor"] = []
                    }
                    items[tutorName]["url"] = "https://raw.githubusercontent.com/ydarissep/dex-core/main/sprites/Tutor.png"
                    if(move in moves){
                        items[tutorName]["description"] = moves[move]["description"].join("")
                        items[tutorName]["pocket"] = "POCKET_TUTOR"
                        items[tutorName]["url"] = `https://raw.githubusercontent.com/ydarissep/dex-core/main/sprites/TM_${moves[move]["type"]}.png`
                    }
                    items[tutorName]["locations"]["Tutor"].push(zone)
                }
            }

            scriptName = null
            moveArray = []
            zone = null
        }
        else if(/MOVE_/.test(line)){
            moveArray.push(line.match(/MOVE_\w+/)[0])
        }
        else if(scriptName && /MoveTutor_EventScript_OpenPartyMenu|EventScript_ConfirmMoveSelection/i.test(line)){
            zone = scriptName.match(/(\w+)_EventScript/i)[1].replaceAll("_", " ").replace(/([A-Z])/g, " $1").replace(/(\d+)/g, " $1").trim()
        }
    })
}









function initTrainer(trainers, trainer, zone){
    if(!trainers[zone]){
        trainers[zone] = {}
    }
    if(!trainers[zone][trainer]){
        trainers[zone][trainer] = {}
    }
    trainers[zone][trainer]["sprite"] = ""
    trainers[zone][trainer]["ingameName"] = sanitizeString(trainer)
    trainers[zone][trainer]["items"] = []
    trainers[zone][trainer]["double"] = false
    trainers[zone][trainer]["party"] = {}
}


function initItem(name){
    items[name] = {}
    items[name]["name"] = name
    items[name]["url"] = ""
    items[name]["description"] = ""
    items[name]["locations"] = {}
    items[name]["pocket"] = ""
    items[name]["price"] = 0
    items[name]["ingameName"] = sanitizeString(name)
    items[name]["effect"] = ""
}



function initScriptsLocations(speciesName, zone, method){
    if(!locations[zone]){
        locations[zone] = {}
    }
    if(!locations[zone][method]){
        locations[zone][method] = {}
    }
    if(!locations[zone][method][species]){
        locations[zone][method][speciesName] = 100
        
        const counter = locationsTracker.length
        locationsTracker[counter] = {}
        locationsTracker[counter]["key"] = `${zone}\\${method}\\${speciesName}`
        locationsTracker[counter]["filter"] = []
    }
}







function regexScript(text, scriptPath, tradeArray, specialFunctions, regexSpecialFunctions){
    let map = false
    let zone = sanitizeString(scriptPath.match(/(\w+).\w+/i)[1].replaceAll("_", " ").replace(/([A-Z])/g, " $1").replace(/(\d+)/g, " $1").trim())

    if(/data\/maps\/(.*)\/scripts.\w+/i.test(scriptPath)){
        map = true
        zone = scriptPath.match(/data\/maps\/(.*)\/scripts.\w+/i)[1].replaceAll("_", "").replace(/([A-Z])/g, " $1").replace(/(\d+)/g, " $1").trim()
    }

    if(map){
        const trainersFromScript = Array.from(new Set(text.match(/TRAINER_\w+/g)))
        for(let k = 0; k < trainersFromScript.length; k++){
            initTrainer(trainers, trainersFromScript[k], zone)
        }

        if(/CreateEventLegalEnemyMon|seteventmon/i.test(text)){
            const speciesEvent = Array.from(new Set(text.match(/SPECIES_\w+/g)))
            for(let k = 0; k < speciesEvent.length; k++){
                initScriptsLocations(speciesEvent[k], zone, "Scripted Battle")
            }
        }

        const wildBattle = Array.from(new Set(text.match(/setwildbattle\w*\s*(?:\(\s*)?SPECIES_\w+/ig)))
        for(let k = 0; k < wildBattle.length; k++){
            initScriptsLocations(wildBattle[k].match(/SPECIES_\w+/)[0], zone, "Scripted Battle")
        }

        const tradeMatch = Array.from(new Set(text.match(/INGAME_TRADE_\w+/g)))
        for(let k = 0; k < tradeMatch.length; k++){
            tradeArray.forEach(trade => {
                if(trade.includes(tradeMatch[k])){
                    const speciesName = trade.match(/.species\s*=\s*(SPECIES_\w+)/i)
                    if(speciesName){
                        initScriptsLocations(speciesName[1], zone, "Trade")
                    }
                }
            })
        }
    }

    const finditemMatch = Array.from(new Set(text.match(/finditem\s*ITEM_\w+/g)))
    for(let k = 0; k < finditemMatch.length; k++){
        let itemName = finditemMatch[k].match(/ITEM_\w+/)[0]
        if (!(itemName in items)){
            const itemNameRegex = new RegExp(itemName.replace("ITEM_", ""), "i")
            Object.keys(items).forEach(name => {
                if (itemNameRegex.test(items[name]["ingameName"].replaceAll(" ", "_"))){
                    itemName = items[name]["name"]
                }
            })
        }
        if(!items[itemName]["locations"]["Find"]){
            items[itemName]["locations"]["Find"] = []
        }
        items[itemName]["locations"]["Find"].push(zone)
    }
    
    const giveitemMatch = Array.from(new Set(text.match(/giveitem\s*(?:\(\s*)?ITEM_\w+|additem\s+ITEM_\w+/g)))
    for(let k = 0; k < giveitemMatch.length; k++){
        let itemName = giveitemMatch[k].match(/ITEM_\w+/)[0]
        if (!(itemName in items)){
            const itemNameRegex = new RegExp(itemName.replace("ITEM_", ""), "i")
            Object.keys(items).forEach(name => {
                if (itemNameRegex.test(items[name]["ingameName"].replaceAll(" ", "_"))){
                    itemName = items[name]["name"]
                }
            })
        }
        if(!items[itemName]["locations"]["Gift"]){
            items[itemName]["locations"]["Gift"] = []
        }
        items[itemName]["locations"]["Gift"].push(zone)
    }

    const buyitemMatch = Array.from(new Set(text.match(/.2byte\s+ITEM_\w+/g)))
    for(let k = 0; k < buyitemMatch.length; k++){
        let itemName = buyitemMatch[k].match(/ITEM_\w+/)[0]
        if (!(itemName in items)){
            const itemNameRegex = new RegExp(itemName.replace("ITEM_", ""), "i")
            Object.keys(items).forEach(name => {
                if (itemNameRegex.test(items[name]["ingameName"].replaceAll(" ", "_"))){
                    itemName = items[name]["name"]
                }
            })
        }
        if(!items[itemName]["locations"]["Buy"]){
            items[itemName]["locations"]["Buy"] = []
        }
        items[itemName]["locations"]["Buy"].push(zone)
    }

    if(/\s+givemon(?:\s+|\()|\s+giveegg(?:\s+|\()/i.test(text)){
        const giveMatch = Array.from(new Set(text.match(/givemon\s*(?:\(\s*)?SPECIES_\w+|giveegg\s*(?:\(\s*)?SPECIES_\w+/g)))
        for(let k = 0; k < giveMatch.length; k++){
            if(scriptPath === "data/event_scripts.s"){
                zone = "Mystery Gift"
            }
            initScriptsLocations(giveMatch[k].match(/SPECIES_\w+/)[0], zone, "Gift")
        }

        const giveItemMatch = Array.from(new Set(text.match(/givemon\s*(?:\(\s*)?SPECIES_\w+\s*,\s*\d+\s*,\s*ITEM_\w+/g)))
        for(let k = 0; k < giveItemMatch.length; k++){
            const itemName = giveItemMatch[k].match(/ITEM_\w+/)[0]
            if(!items[itemName]["locations"]["Held"]){
                items[itemName]["locations"]["Held"] = []
            }
            if(!items[itemName]["locations"]["Held"].includes(zone)){
                items[itemName]["locations"]["Held"].push(zone)
            }
        }

        const specialFunctionMatch = Array.from(new Set(text.match(regexSpecialFunctions)))
        for(let k = 0; k < specialFunctionMatch.length; k++){
            specialFunctions[specialFunctionMatch[k]].forEach(speciesName => {
                if(speciesName in species){
                    initScriptsLocations(speciesName, zone, "Gift")
                }
            })
        }
    }
}