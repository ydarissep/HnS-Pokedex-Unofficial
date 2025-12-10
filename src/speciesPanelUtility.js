fetch("https://raw.githubusercontent.com/ydarissep/dex-core/main/src/speciesPanelUtility.js").then(response => {
    return response.text()
}).then(text => {
    text = text.replace("function applyShinyVar", "function applyShinyVarOld")
    eval.call(window,text)
}).catch(error => {
    console.warn(error)
})








async function applyShinyVar(speciesName){
    let sprite = new Image()
    let canvas = document.createElement("canvas")

    sprite.src = sprites[speciesName]

    canvas.width = sprite.width
    canvas.height = sprite.height


    let rawNormalPal = await fetch(`${species[speciesName]["sprite"].replace(/\w+\.png/, "normal.pal")}`)
    if(rawNormalPal.status === 404){
        if(species[speciesName]["forms"].length > 1){
            rawNormalPal = await fetch(`${species[species[speciesName]["forms"][0]]["sprite"].replace(/\w+\.png/, "normal.pal")}`)
        }
    }
    const textNormalPal = await rawNormalPal.text()

    let normalPal = textNormalPal.replaceAll("\r", "").split("\n").toSpliced(0, 3)


    const isShinyModern = await fetch(`${species[speciesName]["sprite"].replace(/\w+\.png/, "shiny_modern.pal")}`, {method: "HEAD"})
    let rawShinyPal = null
    if (isShinyModern.ok){
        rawShinyPal = await fetch(`${species[speciesName]["sprite"].replace(/\w+\.png/, "shiny_modern.pal")}`)
    }
    else {
        rawShinyPal = await fetch(`${species[speciesName]["sprite"].replace(/\w+\.png/, "shiny.pal")}`)
        if (!rawShinyPal || !rawShinyPal.ok) {
            if(species[speciesName]["forms"].length > 1){
                rawShinyPal = await fetch(`${species[species[speciesName]["forms"][0]]["sprite"].replace(/\w+\.png/, "shiny.pal")}`)
            }
        }
    }

    const textShinyPal = await rawShinyPal.text()

    let shinyPal = textShinyPal.replaceAll("\r", "").split("\n").toSpliced(0, 3)

    const context = canvas.getContext('2d')

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(sprite, 0, 0)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    for(let i = 0; i < imageData.data.length; i += 4) {
        if(normalPal.includes(`${imageData.data[i]} ${imageData.data[i + 1]} ${imageData.data[i + 2]}`)){
            const index = normalPal.indexOf(`${imageData.data[i]} ${imageData.data[i + 1]} ${imageData.data[i + 2]}`)
            const shinyPalArray = shinyPal[index].split(" ")
            imageData.data[i] = shinyPalArray[0]
            imageData.data[i + 1] = shinyPalArray[1]
            imageData.data[i + 2] = shinyPalArray[2]
        }
    }
    
    context.putImageData(imageData, 0, 0)
    speciesSprite.src = canvas.toDataURL()
}