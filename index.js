const connectDB = require('./db');
const express = require('express');
const cors = require('cors');
const userRouter = require('./routes/user');
const dotenv = require('dotenv').config();

connectDB()
    .then(() => {
        const app = express();

        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        app.use(cors());

        app.use('/user',userRouter);

        app.listen(process.env.PORT || 2005, () => {
            console.log(`Server started @ ${process.env.PORT || 2005}`);
        })

    }).catch((error) => {
        console.log(`app buliding failed ${error}`);
        process.exit(1);
    })