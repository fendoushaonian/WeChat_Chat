const { app, BrowserWindow, ipcMain, shell, clipboard, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const { chatCompletion } = require('./aiProvider')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// 简易持久化 (避免 electron-store 的 ESM/CJS 兼容问题)
const userDataDir = () => app.getPath('userData')
const storeFile = () => path.join(userDataDir(), 'moments-writer-store.json')

function readStore() {
  try {
    const f = storeFile()
    if (!fs.existsSync(f)) return {}
    return JSON.parse(fs.readFileSync(f, 'utf-8') || '{}')
  } catch {
    return {}
  }
}

function writeStore(obj) {
  try {
    if (!fs.existsSync(userDataDir())) fs.mkdirSync(userDataDir(), { recursive: true })
    fs.writeFileSync(storeFile(), JSON.stringify(obj, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('writeStore error:', err)
    return false
  }
}

// 主进程启动时强制做一次数据迁移, 不依赖前端 hydrate
function migrateStoreOnStartup() {
  try {
    const data = readStore()
    const s = data.settings || {}
    let changed = false
    // 用户购买的是 GLM-4.6V 资源包, 老/错模型全部迁到 4.6v
    if (
      s.provider === 'zhipu' &&
      (s.model === 'glm-4.6' ||
        s.model === 'glm-4-flash' ||
        s.model === 'glm-4-flashx' ||
        !s.model)
    ) {
      s.model = 'glm-4.6v'
      changed = true
    }
    // 百度欠费旧 Key 重置
    if (typeof s.apiKey === 'string' && /^bce-v3\//.test(s.apiKey)) {
      s.provider = 'zhipu'
      s.apiKey = ''
      s.model = 'glm-4.6v'
      changed = true
    }
    if (changed) {
      data.settings = s
      writeStore(data)
      console.log('[migrate] settings updated to', s)
    }
  } catch (err) {
    console.error('[migrate] failed:', err)
  }
}

/** @type {BrowserWindow | null} */
let mainWindow = null

// 窗口图标: 根据平台选择合适格式
function resolveIconPath() {
  const base = path.join(__dirname, '..', 'build')
  if (process.platform === 'win32') return path.join(base, 'icon.ico')
  // macOS/Linux 用高分辨率 PNG
  return path.join(base, 'icon.png')
}

function createWindow() {
  const iconPath = resolveIconPath()
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: '朋友圈文案助手',
    backgroundColor: '#fef2f4',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 外链走系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  migrateStoreOnStartup()
  // 关闭默认菜单 (Win/Linux), macOS 保留系统菜单但定制
  if (process.platform === 'darwin') {
    const template = [
      { role: 'appMenu' },
      { role: 'editMenu' },
      { role: 'viewMenu' },
      { role: 'windowMenu' },
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  } else {
    Menu.setApplicationMenu(null)
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ============== IPC ==============

// 获取/保存设置
ipcMain.handle('store:get', (_e, key) => {
  const data = readStore()
  return key ? data[key] : data
})
ipcMain.handle('store:set', (_e, key, value) => {
  const data = readStore()
  if (typeof key === 'object' && key !== null) {
    Object.assign(data, key)
  } else {
    data[key] = value
  }
  return writeStore(data)
})
ipcMain.handle('store:delete', (_e, key) => {
  const data = readStore()
  delete data[key]
  return writeStore(data)
})

// 复制到剪贴板
ipcMain.handle('clipboard:write', (_e, text) => {
  clipboard.writeText(String(text || ''))
  return true
})

// 打开外部链接
ipcMain.handle('shell:openExternal', (_e, url) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    shell.openExternal(url)
    return true
  }
  return false
})

// 调用 AI (多 Provider 通用)
ipcMain.handle('ai:generate', async (_e, { settings, messages }) => {
  try {
    const text = await chatCompletion(settings || {}, messages || [])
    return { ok: true, text }
  } catch (err) {
    return { ok: false, error: (err && err.message) || String(err) }
  }
})
