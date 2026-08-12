const fs = require('fs')
const path = require('path')

const directories = [
  path.resolve(__dirname, 'backend/src'),
  path.resolve(__dirname, 'frontend/src'),
]

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let originalContent = content
  
  // Replacements for endpoints and variables
  content = content.replace(/\/corporate/g, '/contractor')
  content = content.replace(/corporate/g, 'contractor')
  content = content.replace(/Corporate/g, 'Contractor')
  content = content.replace(/CORPORATE/g, 'CONTRACTOR')

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`Updated: ${filePath}`)
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      traverseDir(fullPath)
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath)
    }
  }
}

directories.forEach(dir => traverseDir(dir))
console.log('Done.')
