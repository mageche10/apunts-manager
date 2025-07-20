const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require("electron/main")
const path = require('path')

const ConfigManager = require('./configManager')
const TemesManager = require('./temesManager')
const { exec } = require("child_process")
const { error } = require("console")

let win

const createWindow = () => {
    win = new BrowserWindow({
        width: 1100,
        height: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.setMenuBarVisibility(false)
    win.loadFile('index.html')
}

app.whenReady().then(async () => {
    await ConfigManager.checkFile();
    
    await loadConfigApi()
    await loadMainApi()

    registerGlobalShortcuts()

    createWindow()
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

function registerGlobalShortcuts() {
    globalShortcut.register('Control+Alt+F', () => {
        win.focus()

        win.webContents.send('new-figure-shortcut')

    })
}

async function loadMainApi() {
    ipcMain.handle('getAllTemes', async (event, data) => { return await TemesManager.getAllTemes(data) })
    ipcMain.handle('getAllFigures', async (event, subjectCode) => { return await TemesManager.getAllFigures(subjectCode)} )
    ipcMain.handle('initSubject', (event, subjectCode) => { return TemesManager.initTemaFiles(subjectCode) })

    ipcMain.handle('editarTema', (event, index, subjectAbb) => TemesManager.editarTema(index, subjectAbb))
    ipcMain.handle('verTema', async (event, index, subjectAbb) => {
        const result = await TemesManager.verTema(index, subjectAbb)
        return result
    })
    ipcMain.handle('newTema', (event, index, subject) => { return TemesManager.newTema(index, subject) })
    ipcMain.handle('borrarTema', async (event, index, subjectAbb) => { return await TemesManager.borrarTema(index, subjectAbb) })

    ipcMain.handle('getErrates', (event, subjectAbb) => { return TemesManager.getErrates(subjectAbb) })
    ipcMain.handle('saveErrates', (event, subjectAbb, data) => { return TemesManager.saveErrates(subjectAbb, data) })
    ipcMain.handle('compileErrates', async () => {
        const dialogResult = await dialog.showOpenDialog(win, {properties: ['openDirectory', 'createDirectory'], defaultPath: ConfigManager.getDefaultOutputPath()})
        if(dialogResult.canceled) {
            return false
        } else {
            const result = await TemesManager.compileErrates(dialogResult.filePaths[0])
            return result
        }
    })

    ipcMain.handle('generarApunts', async (event, subject, tapa, ciutat) => {
        const result = await TemesManager.generarAssignatura(subject, tapa, ciutat)
        if (result == true) {
            exec(`start "" "${ConfigManager.getDefaultOutputPath()}"`)
        }
        return result
    })
    ipcMain.handle('generarApuntsAll', async (event, tapa, ciutat) => {
        const subjects = ConfigManager.getSubjectsData()
        const outputDir = ConfigManager.getDefaultOutputPath()

        try {
            for (const subject of subjects) {
                const result = await TemesManager.generarAssignatura(subject, tapa, ciutat)
                if (result != true) {
                    throw result
                }
            }
            exec(`start "" "${outputDir}"`)

            if (tapa) {
                const paths = subjects.map(subject => path.join(outputDir,`Apunts ${subject.nom}.pdf`))
                TemesManager.mergePDFs(paths, path.join(outputDir, 'main.pdf'))
            }

            return true
        } catch (e) {
            return e
        }

    })

    ipcMain.handle('openInkscape', (event, filePath) => { return TemesManager.openInkscape(filePath) })
    ipcMain.handle('insertOnLatex', (event, figureName) => { return TemesManager.insertOnLatex(figureName) })
    ipcMain.handle('createFigure', (event, name, subjectCode) => { return TemesManager.createFigure(name, subjectCode) })
    ipcMain.handle('deleteFigure', (event, figure, assignatura) => { return TemesManager.deleteFigure(figure, assignatura)})

    ipcMain.handle('getAssignaturaColors', async (event, subjectCode) => { return await TemesManager.getAssignaturaColors(subjectCode) })
    ipcMain.handle('setSubjectColor', async (event, subjectCode, color) => { return await TemesManager.setSubjectColor(subjectCode, color) })

    ipcMain.handle('reorderTemes', async (event, subjectCode, newOrder) => { return await TemesManager.reorderTemes(subjectCode, newOrder) })
}

async function loadConfigApi() {
    ipcMain.handle('getSubjectsData', () => {
        return ConfigManager.getSubjectsData()
    })
    ipcMain.handle('saveSubjectsData', async (event, data) => {
        return ConfigManager.saveSubjectsData(data)
    })
    ipcMain.handle('getDataPath', () => ConfigManager.getDataPath())
    ipcMain.handle('saveDataPath', (event, data) => ConfigManager.saveDataPath(data))
    ipcMain.handle('getVSEnvPath', () => ConfigManager.getVSEnvPath())
    ipcMain.handle('saveVSEnvPath', (event, data) => ConfigManager.saveVSEnvPath(data))
    ipcMain.handle('getDefaultOutputPath', () => ConfigManager.getDefaultOutputPath())
    ipcMain.handle('saveDefaultOutputPath', (event, data) => ConfigManager.saveDefaultOutputPath(data))
    ipcMain.handle('getSumatraPath', () => ConfigManager.getSumatraPath())
    ipcMain.handle('saveSumatraPath', (event, data) => ConfigManager.saveSumatraPath(data))
    ipcMain.handle('getInkscapePath', () => ConfigManager.getInkscapePath())
    ipcMain.handle('saveInkscapePath', (event, data) => ConfigManager.saveInkscapePath(data))

    ipcMain.handle('openDirectorySelector', async (event, initialPath) => {
        const result = await dialog.showOpenDialog(win, {properties: ['openDirectory', 'createDirectory'], defaultPath: initialPath})
        if (result.canceled) {
            return null
        } else {
            return result.filePaths[0]
        }
    })

    ipcMain.handle('openExeSelector', async (event, initialPath) => {
        const result = await dialog.showOpenDialog(win, {properties: ['openFile'], defaultPath: initialPath, filters: [{name: "Executables", extensions: ['exe']}] })
        if (result.canceled) {
            return null
        } else {
            return result.filePaths[0]
        }
    })

    ipcMain.handle('getColorMap', () => ConfigManager.getColorMap())
}