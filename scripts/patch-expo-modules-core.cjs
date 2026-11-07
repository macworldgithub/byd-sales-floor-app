const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../node_modules/expo-modules-core/ios/Core/Functions/AsyncFunctionDefinition.swift');
if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes('switch consume result {') || content.includes('switch result {')) {
    content = content.replace(
      /self\.call\(appContext, this: this, arguments: arguments\) \{ \[promise\] result in\s+switch (?:consume )?result \{[\s\S]*?promise\.reject\(error\)[\s\S]*?\}\s+\}/,
      `self.call(appContext, this: this, arguments: arguments) { [promise] result in\n        do {\n          let value = try result.get()\n          promise.resolve(value)\n        } catch {\n          promise.reject(error)\n        }\n      }`
    );
    fs.writeFileSync(targetFile, content);
    console.log('✅ Successfully patched expo-modules-core for Swift 6.2 compatibility');
  }
}

