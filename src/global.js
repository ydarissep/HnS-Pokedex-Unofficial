window.repo = "PokemonHnS-Development/pokemonHnS/main"
window.checkUpdate = "0 HnS"
window.showShinyToggle = true


fetch('https://raw.githubusercontent.com/ydarissep/dex-core/main/index.html').then(async response => {
	return response.text()
}).then(async rawHTMLText => {
	const parser = new DOMParser()
	const doc = parser.parseFromString(rawHTMLText, 'text/html')
    document.querySelector('html').innerHTML = doc.querySelector('html').innerHTML


    document.title = "HnS Dex"
    document.getElementById("footerName").innerText = "Heart & Soul\nUnofficial Pokedex"
    

    await fetch("https://raw.githubusercontent.com/ydarissep/dex-core/main/src/global.js").then(async response => {
        return response.text()
    }).then(async text => {
        await eval.call(window,text)
    }).catch(error => {
        console.warn(error)
    })    

}).catch(error => {
	console.warn(error)
})


