const fs = require('fs');
const img = fs.readFileSync('imgline.txt', 'utf8').trim();
let app = fs.readFileSync('src/App.jsx', 'utf8');

const target = '<div style={{fontFamily:"\'Barlow Condensed\',sans-serif",fontWeight:900,fontSize:26,fontStyle:"italic",color:"#fff"}}>VAMOS<span style={{color:"#ff4d00"}}>RC</span></div>';

if (app.includes(target)) {
  app = app.replace(target, img);
  fs.writeFileSync('src/App.jsx', app);
  console.log('OK: image inserted (' + img.length + ' chars)');
} else {
  console.log('ERROR: target not found');
  // ターゲット探索のヒント
  const idx = app.indexOf('VAMOS');
  if (idx >= 0) {
    console.log('Found "VAMOS" at index ' + idx + ':');
    console.log(app.substring(idx, idx + 250));
  }
}
