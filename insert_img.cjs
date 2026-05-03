const fs = require('fs');
const img = fs.readFileSync('imgline.txt', 'utf8').trim();
let app = fs.readFileSync('src/App.jsx', 'utf8');

const target = '<div style={{fontFamily:"\\'Barlow Condensed\\',sans-serif",fontWeight:900,fontSize:26,fontStyle:"italic",color:"#fff"}}>VAMOS<span style={{color:"#ff4d00"}}>RC</span></div>';

// 全ての出現箇所を置換 (split + join で全置換)
if (app.includes(target)) {
  const count = app.split(target).length - 1;
  app = app.split(target).join(img);
  fs.writeFileSync('src/App.jsx', app);
  console.log(`OK: image inserted in ${count} location(s) (${img.length} chars each)`);
} else {
  console.log('ERROR: target not found');
  const idx = app.indexOf('VAMOS');
  if (idx >= 0) {
    console.log('Found "VAMOS" at index ' + idx + ':');
    console.log(app.substring(idx, idx + 250));
  }
}
