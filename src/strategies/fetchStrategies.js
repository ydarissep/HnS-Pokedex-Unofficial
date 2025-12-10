async function getStrategies(strategies){
    footerP("Fetching strategies")
    const rawStrategies = await fetch(`https://raw.githubusercontent.com/PCG06/pokeyaeeh/YAEEH/dex_strats.txt`)
    const textStrategies = await rawStrategies.text()

    return regexStrategies(textStrategies, strategies)
}




async function buildStrategiesObj(){
    let strategies = {}

    setTimeout(() => {
        timeout = true
    }, "3000");

    try{
        //strategies = await getStrategies(strategies)
    }
    catch(e){
        console.log(e.message)
        console.log(e.stack)
    }

    //await localStorage.setItem("strategies", LZString.compressToUTF16(JSON.stringify(strategies)))
    return strategies
}



async function fetchStrategiesObj(){
    if(!localStorage.getItem("strategies"))
        window.strategies = await buildStrategiesObj()
    else
        window.strategies = await JSON.parse(LZString.decompressFromUTF16(localStorage.getItem("strategies")))
}

