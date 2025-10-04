const app = require('./app');

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI ;

mongoose = require('mongoose');
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Mongo connected');
    app.listen(PORT, () => console.log('Server running on ' + PORT));
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
