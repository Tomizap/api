const app = require("./src/app");
const port = 7000;

// app.listen()
app.listen(port, () => {
  console.log(`App running on : http://localhost:${port}`);
});
