const fs = require('fs')
const path = require('path')

const directories = [
  path.resolve(__dirname, 'backend/src'),
  path.resolve(__dirname, 'frontend/src'),
]

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let originalContent = content
  
  // Replacements
  content = content.replace(/USER_ROLES\.INDIVIDUAL/g, 'USER_ROLES.CUSTOMER')
  content = content.replace(/USER_ROLES\.CORPORATE/g, 'USER_ROLES.CONTRACTOR')
  content = content.replace(/role === 'individual'/g, "role === 'customer'")
  content = content.replace(/role === 'corporate'/g, "role === 'contractor'")
  content = content.replace(/role !== 'individual'/g, "role !== 'customer'")
  content = content.replace(/role !== 'corporate'/g, "role !== 'contractor'")
  content = content.replace(/'individual'/g, "'customer'")
  content = content.replace(/'corporate'/g, "'contractor'")

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
