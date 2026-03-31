const express = require('express');
const app = express();
const PORT = process.env.PORT || 3300;

app.get('/', (req, res) => {
  res.send('🚀 GetCash Server is ALIVE! 🎉');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});