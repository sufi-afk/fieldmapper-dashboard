const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3001;

// Serve all files in /public (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`\n✅ FieldMapper Dashboard running!`);
  console.log(`👉 Open your browser at: http://localhost:${PORT}\n`);
});