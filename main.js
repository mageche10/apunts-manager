const { app, BrowserWindow, ipcMain } = require("electron/main")
const path = require('path')
const fs = require('fs')

const createWindow = () => {
    const win = new BrowserWindow({
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

app.whenReady().then(() => {
    ipcMain.handle('getSubjectsData', () => {
        const filePath = path.join(__dirname, 'data/assignatures.json')
        const rawData = fs.readFileSync(filePath, "utf-8")
        const obj = JSON.parse(rawData)
        return obj
    })
    ipcMain.handle('saveSubjectsData', async (event, data) => {
        try {
            const filePath = path.join(__dirname, 'data/assignatures.json')
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
            return true
        } catch (err) {
            return false
        }
    })
    createWindow()
})