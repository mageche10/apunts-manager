const fs = require('fs')
const path = require('path')
const readline = require('readline')
const ConfigManager = require('./configManager')

const TemesManager = {
    async getAllTemes(subjectCode) {
        const folder = path.join(ConfigManager.getDataPath(), subjectCode)

        //Comprobar si existeix la carpeta i si no crearla
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder)
            // Falta afegir master.tex i ./figures
        }

        const temes = []
        const files = fs.readdirSync(folder).filter((file) => file.startsWith("tema"))
        
        for (const file of files){
            firstLine = await this.readFirstLine(path.join(folder, file))

            const match = firstLine.match(/\\lecture\{.*?\}\{.*?\}\{(.*?)\}/);
            title = match[1]

            temes.push({
                index: parseInt(file.slice(4, 6), 10),
                name: title
            })
        }
        return temes
    },

    async readFirstLine(ruta) {
        let x = "";
        const fileStream = fs.createReadStream(ruta);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        for await (const linea of rl) {
            x = linea
            rl.close();
            break;
        }
        return x
    }
}

module.exports = TemesManager