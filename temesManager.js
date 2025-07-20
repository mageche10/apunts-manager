const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { exec } = require("child_process")
const ConfigManager = require('./configManager')
const { app, clipboard } = require('electron')
const { PDFDocument } = require('pdf-lib');


const erratasPath = app.isPackaged ? path.join(process.resourcesPath, 'erratas.json') : path.join(__dirname, '/data/erratas.json')
const masterTemplatePath = app.isPackaged ? path.join(process.resourcesPath, "master.tex") : path.join(__dirname, "/data/master.tex") // TODO: marcar com extrafiles en electron builder el master,tex
const tapaDirectoryPath = app.isPackaged ? process.resourcesPath : path.join(__dirname, '/data/')
const tapaPath = app.isPackaged ? path.join(process.resourcesPath, "tapa.tex") : path.join(__dirname, "/data/tapa.tex")

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

const TemesManager = {
    pad(num) {
        return String(num).padStart(2, '0')
    },

    initTemaFiles(subjectCode) {
        const dirPath = path.join(ConfigManager.getDataPath(), subjectCode)

        try {
            fs.mkdirSync(dirPath)
            fs.mkdirSync(path.join(dirPath, "figures"))

            fs.copyFileSync(masterTemplatePath, path.join(dirPath, "master.tex"))
        } catch (err) {
            return false
        }
    },

    async getAllFigures(subjectCode) {
        const folder = path.join(ConfigManager.getDataPath(), subjectCode, '/figures')
        
        const figures = []
        const files = fs.readdirSync(folder).filter((file) => file.endsWith('.svg'))
        
        for (const file of files){
            figures.push({
                file: path.join(folder, file),
                name: file.replaceAll('-', ' ').slice(0, -4),
            })
        }
        return figures
    },

    async getAllTemes(subjectCode) {
        const folder = path.join(ConfigManager.getDataPath(), subjectCode)

        //Comprobar si existeix la carpeta
        if (!fs.existsSync(folder)) {
            return -1
        }

        const temes = []
        const files = fs.readdirSync(folder).filter((file) => file.startsWith("tema") && file.endsWith('.tex'))
        
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

        const cmd = `code "${dirPath}" --goto "${filePath}" "${masterPath}" --user-data-dir="${userDataDir}" --extensions-dir="${extensionsDir}"`
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

        
        
        try{
            const cmdCompile = `latexmk -pdf -interaction=nonstopmode "${masterPath}" -output-directory="${dirPath}"`
            await execPromise(cmdCompile, {cwd: dirPath})

            const cmdSumatra = `"${ConfigManager.getSumatraPath()}" "${pdfPath}"`
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
        const filepath = path.join(outputPath, 'errates.tex')

        var content = erratesHeader

        const subjects = ConfigManager.getSubjectsData()
        subjects.forEach(subject => {
            const erratesSubject = this.getErrates(subject.abb)
            if (erratesSubject.length != 0){
                content = content.concat(`
                    \\subsection*{${subject.nom}}
                    
                    \\begin{itemize}
                    `)

                erratesSubject.forEach(errada => {
                    content = content.concat(`\\item ${errada.errada} - \\textbf{Pág ${errada.pag}} \n`)
                })
                content = content.concat(`\n \\end{itemize}\n`)
            }
        });

        content = content.concat(erratesFooter)
        
        fs.writeFileSync(filepath, content)

        try {
            cmdCompile = `latexmk -pdf -interaction=nonstopmode "${filepath}" -output-directory="${outputPath}"`
            await execPromise(cmdCompile, {cwd: outputPath})

            fs.unlinkSync(filepath)
            fs.unlinkSync(path.join(outputPath, "errates.aux"))
            fs.unlinkSync(path.join(outputPath, "errates.fls"))
            fs.unlinkSync(path.join(outputPath, "errates.log"))
            fs.unlinkSync(path.join(outputPath, "errates.fdb_latexmk"))

            const cmdSumatra = `"${ConfigManager.getSumatraPath()}" "${path.join(outputPath, "errates.pdf")}"`
            exec(cmdSumatra)

            return true
        } catch (e) {
            console.log(e)
            return false
        }
    },

    async generarAssignatura(subject, tapa, ciutat) {
        try {
            const dirPath = path.join(ConfigManager.getDataPath(), subject.abb)
            const masterPath = path.join(dirPath, "master.tex")
            const masterPDFPath = path.join(dirPath, 'master.pdf')
            const outputDir = ConfigManager.getDefaultOutputPath()

            const temes = await this.getAllTemes(subject.abb)
            const indexes = Array.from({ length: temes.length }, (_, i) => i + 1)
            this.editarMaster(indexes, masterPath)

            const cmdCompile = `latexmk -f -gg -pdf -interaction=nonstopmode "${masterPath}" -output-directory="${dirPath}"`
            await execPromise(cmdCompile, {cwd: dirPath})

            if (tapa) {
                const resultTapa = await this.editarCompilarTapa(subject, ciutat)
                if (resultTapa) {
                    const tapaPath = path.join(dirPath, 'tapa.pdf')

                    await this.mergePDFs([tapaPath, masterPDFPath], masterPDFPath)
                } else {
                    throw e
                }
            }

            const outputPath = path.join(outputDir, `Apunts ${subject.nom}.pdf`)
            fs.copyFileSync(masterPDFPath, outputPath)

            return true
        } catch (e) {
            return e
        }
    },
    
    async editarCompilarTapa(subject, ciutat) {
        const LINEA_NOM_ASSIGNATURA = 29
        const LINEA_CIUTAT = 47

        try {
            const file = fs.readFileSync(tapaPath, 'utf-8')
            const lineas = file.split(/\r?\n/)

            lineas[LINEA_NOM_ASSIGNATURA - 1] = subject.nom
            lineas[LINEA_CIUTAT - 1] = (ciutat == 'barcelona') ? "Enginyeria \\textsc{Física} \\ \\ \\textit{Barcelona}" : "Enginyeria \\textsc{Aeroespacial} \\ \\ \\textit{Terrassa}"
            
            const nuevoContenido = lineas.join('\n')
            fs.writeFileSync(tapaPath, nuevoContenido, 'utf-8')

            const dirPath = path.join(ConfigManager.getDataPath(), subject.abb)
            const cmdCompile = `latexmk -f -gg -pdf -interaction=nonstopmode "${tapaPath}" -output-directory="${dirPath}"`
            await execPromise(cmdCompile, {cwd: tapaDirectoryPath})

            return true
        } catch (e) {
            return e
        }
    },

    async mergePDFs(pdfPaths, outputPath) {
        const mergedPdf = await PDFDocument.create()

        for (const path of pdfPaths) {
            const pdfBytes = fs.readFileSync(path);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        fs.writeFileSync(outputPath, mergedPdfBytes);
    },

    openInkscape(filePath) {
        const inkscapePath = ConfigManager.getInkscapePath()

        const cmd = `"${inkscapePath}" "${filePath}"`
        exec(cmd)
    },

    insertOnLatex(figureName) {
        const text = `
\\begin{figure}[ht]
    \\centering
    \\incfig[1]{${figureName.replaceAll(' ', '-')}}
\\end{figure}`

        clipboard.writeText(text)
    },

    createFigure(name, subjectCode) {
        try {
            const svgMinContent =  `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"/>`

            filePath = path.join(ConfigManager.getDataPath(), subjectCode, 'figures/', `${name.replaceAll(' ', '-')}.svg`)
            fs.writeFileSync(filePath, svgMinContent)

            this.insertOnLatex(name)
            this.openInkscape(filePath)
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    },

    deleteFigure(figura, assignatura) {
        const folder = path.join(ConfigManager.getDataPath(), assignatura.abb, '/figures')
        
        try {
            const files = fs.readdirSync(folder)
            for (const file of files) {
                if (file.includes(figura.name.replaceAll(' ', '-'))) {
                    fs.unlinkSync( path.join(folder, file))
                }
            }
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    },

    async getAssignaturaColors(subjectCode) {
        const masterPath = path.join(ConfigManager.getDataPath(), subjectCode, 'master.tex')
        let tex = fs.readFileSync(masterPath, 'utf-8')
        
        const regexPrimary = /(\\definecolor\{primary\}\{HTML\}\{)(.*?)(\})/;
        const regexSecondary = /(\\definecolor\{secondary\}\{HTML\}\{)(.*?)(\})/;

        const primaryColor = tex.match(regexPrimary)[2]
        const secondaryColor = tex.match(regexSecondary)[2]

        return {
            primary: primaryColor ? parseInt(primaryColor, 16) : 0x000000, // Default to black if not found
            secondary: secondaryColor ? parseInt(secondaryColor, 16) : 0x000000, // Default to black if not found
            name: "Unknown"
        }
    },

    async setSubjectColor(subjectCode, color) {
        try {
            const masterPath = path.join(ConfigManager.getDataPath(), subjectCode, 'master.tex')
            let tex = fs.readFileSync(masterPath, 'utf-8')
        
            const regexPrimary = /(\\definecolor\{primary\}\{HTML\}\{)(.*?)(\})/;
            const regexSecondary = /(\\definecolor\{secondary\}\{HTML\}\{)(.*?)(\})/;

            tex = tex.replace(regexPrimary, `$1${color.primary.toString(16).toUpperCase()}$3`)
            tex = tex.replace(regexSecondary, `$1${color.secondary.toString(16).toUpperCase()}$3`)

            fs.writeFileSync(masterPath, tex, 'utf-8')
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    },

    async reorderTemes(subjectCode, newOrder) {
        try {
            const dirPath = path.join(ConfigManager.getDataPath(), subjectCode)

            const tmpsFiles = []
            newOrder.forEach((oldIndex, newIndex) => {
                if (oldIndex != newIndex + 1){
                    const oldPath = path.join(dirPath, `tema${this.pad(oldIndex)}.tex`)
                    const tmpPath = path.join(dirPath, `tema${this.pad(newIndex + 1)}.tex_tmp`)
                    tmpsFiles.push(tmpPath)
                    fs.renameSync(oldPath, tmpPath)
                }
            })

            tmpsFiles.forEach((tmpPath) => {
                const newPath = tmpPath.replace('_tmp', '')
                fs.renameSync(tmpPath, newPath)
            })

            return true
        }
        catch (e) {
            console.log(e)
            return false
        }
    }
}

module.exports = TemesManager

const erratesHeader = `
\\documentclass[a4paper, 11pt]{report}
\\usepackage[a4paper, margin=1in]{geometry}

\\begin{document}

\\section*{Fe d'errates}
`

const erratesFooter = `
\\end{document}`