const { app, BrowserWindow, ipcMain, dialog } = require("electron/main")
const path = require('path')

const ConfigManager = require('./configManager')
const TemesManager = require('./temesManager')

let win

const createWindow = () => {
    win = new BrowserWindow({
        width: 1050,
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

    ipcMain.handle('getAllTemes', async (event, data) => {
        const temes = await TemesManager.getAllTemes(data)
        return temes
    })

    ipcMain.handle('editarTema', (event, index, subjectAbb) => TemesManager.editarTema(index, subjectAbb))
    ipcMain.handle('verTema', async (event, index, subjectAbb) => {
        const result = await TemesManager.verTema(index, subjectAbb)
        return result
    })
    ipcMain.handle('newTema', (event, index, subjectAbb) => TemesManager.newTema(index, subjectAbb))

    createWindow()
})

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

    ipcMain.handle('openDirectorySelector', async (event, initialPath) => {
        const result = await dialog.showOpenDialog(win, {properties: ['openDirectory', 'createDirectory'], defaultPath: initialPath})
        if (result.canceled) {
            return null
        } else {
            return result.filePaths[0]
        }
    })
}