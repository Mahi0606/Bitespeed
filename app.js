const express = require('express');
const identifyRoutes = require('./routes/identifyRoutes')

const app = express();
app.use(express.json());


app.use('/api', identifyRoutes);


app.get('/', (req, res) => {
    res.send("Hello I am Live !");
})

PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})