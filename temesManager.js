const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { exec } = require("child_process")
const ConfigManager = require('./configManager')
const { app } = require('electron')


const erratasPath = app.isPackaged ? path.join(process.resourcesPath, 'erratas.json') : path.join(__dirname, '/data/erratas.json')

const TemesManager = {
    pad(num) {
        return String(num).padStart(2, '0')
    },

    initTemaFiles(subjectCode) {
        const dirPath = path.join(ConfigManager.getDataPath(), subjectCode)

        try {
            fs.mkdirSync(dirPath)
            fs.mkdirSync(path.join(dirPath, "figures"))

            // En algun moment, selector de colors => estaria be al menu posar el color de la asignatura corresponent
            const masterTemplatePath = app.isPackaged ? path.join(process.resourcesPath, "master.tex") : path.join(__dirname, "master.tex") // TODO: marcar com extrafiles en electron builder el master,tex
            fs.copyFileSync(masterTemplatePath, path.join(dirPath, "master.tex"))
        } catch (err) {
            return false
        }
    },

    async getAllTemes(subjectCode) {
        const folder = path.join(ConfigManager.getDataPath(), subjectCode)

        //Comprobar si existeix la carpeta
        if (!fs.existsSync(folder)) {
            return -1
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

    editarTema(index, subjectCode, indexes = [index]) {
        const userDataDir = path.join(ConfigManager.getVSEnvPath(), 'user-data')
        const extensionsDir = path.join(ConfigManager.getVSEnvPath(), 'extensions' )
        const dirPath = path.join(ConfigManager.getDataPath(), subjectCode)
        const filePath = path.join(dirPath, `tema${this.pad(index)}.tex`)
        const masterPath = path.join(dirPath, "master.tex")

        this.editarMaster(indexes, masterPath)

        const cmd = `code "${dirPath}" --goto "${filePath}" "${masterPath}" --user-data-dir=${userDataDir} --extensions-dir=${extensionsDir}`
        exec(cmd)
    },

    editarMaster(indexTemas, masterPath) {
        let nuevoContenido = []
        indexTemas.forEach(index => {
            nuevoContenido.push(`    \\input{tema${this.pad(index)}.tex}`)
        });
        nuevoContenido = nuevoContenido.join('\n')

        let tex = fs.readFileSync(masterPath, 'utf-8')
        const regex = /(% start lectures)([\s\S]*?)(% end lectures)/;

        tex = tex.replace(regex, `$1\n${nuevoContenido}\n    $3`)
        fs.writeFileSync(masterPath, tex, 'utf-8')
    },

    newTema(index, subject){
        const temaName = `tema${this.pad(index)}`         
        const dirPath = path.join(ConfigManager.getDataPath(), subject.abb)
        const temaPath = path.join(dirPath, `${temaName}.tex`)

        const currentDate = new Date()        
        const dateTime = `${this.pad(currentDate.getDate())}-${this.pad(currentDate.getMonth() + 1)} ${currentDate.getFullYear()} ${this.pad(currentDate.getHours())}:${this.pad(currentDate.getMinutes())}`

        try {
            fs.writeFileSync(temaPath, `\\lecture{${index}}{${dateTime}}{}\n`)
        } catch (err) {
            return false
        }

        const indexes = index == 1 ? [index] : [index - 1, index]
        this.editarTema(index, subject.abb, indexes) 
        return true
    },

    async borrarTema(index, subjectCode){
        const dirPath = path.join(ConfigManager.getDataPath(), subjectCode)
        const temaPath = path.join(dirPath, `tema${this.pad(index)}.tex`) 

        try {
            fs.unlinkSync(temaPath)

            temes = await this.getAllTemes(subjectCode)
            for (let n = 1; n <= temes.length; n++) {
                if (parseInt(temes[n-1].index) != n) {
                    const oldPath = path.join(dirPath, `tema${this.pad(temes[n-1].index)}.tex`)
                    const newPath = path.join(dirPath, `tema${this.pad(n)}.tex`)
                    fs.renameSync(oldPath, newPath)
                }
            }
        } catch (err) {
            return false
        }

        return true
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
    },

    getErrates(subjectCode) {
        const all = JSON.parse(fs.readFileSync(erratasPath, 'utf-8'))
        const errates = all[subjectCode]

        return errates == undefined ? [] : errates
    },

    saveErrates(subjectCode, data) {
        try {
            const all = JSON.parse(fs.readFileSync(erratasPath, 'utf-8'))
            all[subjectCode] = data

            fs.writeFileSync(erratasPath, JSON.stringify(all, null, 2))
            return true
        } catch (e) {
            return false
        }
    },

    async compileErrates(outputPath) {
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

        console.log("S'ha d'implementar la generació del arxiuuuuu")
        const filepath = path.join(outputPath, 'tmp.tex')

        const content = "a"
        fs.writeFileSync(filepath, content)

        try {
            cmdCompile = `latexmk -pdf -interaction=nonstopmode "${filepath}" -output-directory="${outputPath}"`
            await execPromise(cmdCompile, {cwd: outputPath})

            fs.unlinkSync(filepath)
            // TODO: S'ha de borrar tots els arxius que se generin en la compilacio de Latex ------------------

            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }
}

module.exports = TemesManager