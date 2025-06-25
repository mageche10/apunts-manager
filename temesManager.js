const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { exec } = require("child_process")
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

    editarTema(index, subjectCode) {
        const userDataDir = path.join(ConfigManager.getVSEnvPath(), 'user-data')
        const extensionsDir = path.join(ConfigManager.getVSEnvPath(), 'extensions' )
        const dirPath = path.join(ConfigManager.getDataPath(), subjectCode)
        const filePath = path.join(dirPath, `tema${String(index).padStart(2, '0')}.tex`)
        const masterPath = path.join(dirPath, "master.tex")

        this.editarMaster([index], masterPath)

        const cmd = `code "${dirPath}" --goto "${filePath}" "${masterPath}" --user-data-dir=${userDataDir} --extensions-dir=${extensionsDir}`
        exec(cmd)
    },

    editarMaster(indexTemas, masterPath) {
        let nuevoContenido = []
        indexTemas.forEach(index => {
            nuevoContenido.push(`    \\input{tema${String(index).padStart(2, '0')}.tex}`)
        });
        nuevoContenido = nuevoContenido.join('\n')

        let tex = fs.readFileSync(masterPath, 'utf-8')
        const regex = /(% start lectures)([\s\S]*?)(% end lectures)/;

        tex = tex.replace(regex, `$1\n${nuevoContenido}\n    $3`)
        fs.writeFileSync(masterPath, tex, 'utf-8')
    },

    newTema(index, subjectAbb){
        const dirPath = path.join(ConfigManager.getDataPath(), subjectAbb)
        const temaPath = path.join(dirPath, `tema${String(index).padStart(2, '0')}.tex`)

        //this.editarTema(index, subjectAbb)
    },

    async verTema(index, subjectCode){
        const dirPath = path.join(ConfigManager.getDataPath(), subjectCode)
        const masterPath = path.join(dirPath, "master.tex")
        const pdfPath = path.join(dirPath, "master.pdf")

        this.editarMaster([index], masterPath)

        const execPromise = (cmd, opts = {}) => {
            return new Promise((resolve, reject) => {
                exec(cmd, opts, (error, stdout, stderr) => {
                    if (error) {
                        reject(stderr || error.message)
                    } else {
                        resolve(true)
                    }
                })
            })
        }
        
        try{
            const cmdCompile = `latexmk -pdf -interaction=nonstopmode "${masterPath}" -output-directory="${dirPath}"`
            await execPromise(cmdCompile, {cwd: dirPath})

            const cmdSumatra = `"C:\\Program Files\\SumatraPDF\\SumatraPDF.exe" "${pdfPath}"`
            exec(cmdSumatra)

            return true
        } catch (error) {
            console.log(error)
            return false
        }
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