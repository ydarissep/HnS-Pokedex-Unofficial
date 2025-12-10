function regexWildLocations(jsonWildLocations, locations){

	const wildEncounters = jsonWildLocations["wild_encounter_groups"][0]["encounters"]
	const methodArrayWild = ["land_mons", "water_mons", "rock_smash_mons", "fishing_mons"]
	let ignoreHoenn = true

	for(let i = 0; i < wildEncounters.length; i++)
	{
		if (wildEncounters[i]["base_label"] == "gRoute29"){
			ignoreHoenn = false
		}

		if (!ignoreHoenn){
			let zone = "Placeholder"

			if("base_label" in wildEncounters[i]){
				zone = wildEncounters[i]["base_label"].replace(/^g|_/g, "").replace(/Morning|Day|Evening|Night/, "").replace(/([A-Z])/g, " $1").replace(/(\d+)/g, " $1").trim()

				if(!(zone in locations)){
					locations[zone] = {}
				}

				for(let j = 0; j < methodArrayWild.length; j++){
					if(methodArrayWild[j] in wildEncounters[i]){
						for(let k = 0; k < wildEncounters[i][methodArrayWild[j]]["mons"].length; k++){

							let method = replaceMethodString(methodArrayWild[j], k, wildEncounters[i]["base_label"])
							if (!method.includes("Night")){
								method += " Day"
							}
							const name = wildEncounters[i][methodArrayWild[j]]["mons"][k]["species"]
							
							if (species[name]["baseSpeed"] > 0){
								if(!(method in locations[zone])){
									locations[zone][method] = {}
								}


								const rarity = returnRarity(method, k)
								if (rarity < 100){
									if(name in locations[zone][method]){
										locations[zone][method][name] += rarity
									}
									else{
										locations[zone][method][name] = rarity
									}
								}
							}
						}
					}
				}
			}
			else{
				console.log("missing \"base_label\" in wildEncounters[", i, "] (regexWildLocations)")
				continue
			}
		}
	}


    return locations
}



function regexGameCornerLocations(textGameCornerLocations, locations){
	const zone = "Mauville City", method = "Game Corner"
	
	if(!(zone in locations)){
		locations[zone] = {}
	}

	if(!(method in locations[zone])){
		locations[zone][method] = {}
	}

	const speciesArray = textGameCornerLocations.match(/SPECIES_\w+/g)

	for(let i = 0; i < speciesArray.length; i++){
		locations[zone][method][speciesArray[i]] = 100
	}

    return locations
}






function replaceMethodString(method, index, zone){
	const time = zone.match(/Morning|Day|Evening|Night/i)
	let returnMethod

	if(method.match(/fish/i)){
		if(index >=0 && index <= 1){
			returnMethod = "Old Rod"
		}
		else if(index >= 2 && index <= 4){
			returnMethod = "Good Rod"
		}
		else if(index >= 5 && index <= 9){
			returnMethod = "Super Rod"
		}
		else{
			returnMethod = "Fishing"
		}
	}
	else if(method.match(/water/i)){
		returnMethod = "Surfing"
	}
	else if(method.match(/smash/i)){
		returnMethod = "Rock Smash"
	}
	else if(method.match(/land/i)){
		returnMethod = "Land"
	}
    else{
    	console.log(method, zone)
    }

	if(time){
		return `${returnMethod} ${time[0]}`
	}
	else{
		return returnMethod
	}
}


function returnRarity(method, index){
	if(/land/i.test(method)){
		if(index === 0 || index === 1)
			return 20
		else if(index >= 2 && index <= 5){
			return 10
		}
		else if(index >= 6 && index <= 7){
			return 5
		}
		else if(index >= 8 && index <= 9){
			return 4
		}
		else if(index >= 10 || index <= 11){
			return 1
		}
		else
			return 100
	}
	if(/surfing|rock smash/i.test(method)){
		if(index === 0)
			return 60
		else if(index === 1)
			return 30
		else if(index === 2)
			return 5
		else if(index === 3)
			return 4
		else if(index === 4)
			return 1
		else
			return 100
	}
	if(/old rod/i.test(method)){
		if(index === 0)
			return 70
		else if(index === 1)
			return 30
		else 
			return 100
	}
	if(/good rod/i.test(method)){
		if(index === 2)
			return 60
		else if(index === 3 || index === 4)
			return 20
		else 
			return 100
	}
	if(/super rod/i.test(method)){
		if(index >= 5 && index <= 6)
			return 40
		else if(index === 7)
			return 15
		else if(index === 8)
			return 4
		else if(index === 9)
			return 1
		else 
			return 100
	}
    else{
        return 100
    }
}