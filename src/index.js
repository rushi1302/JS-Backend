// require('dotenv').config({ path: './env' })
// for import syntax of dotenv
// always import dotenv at the top of root file.
import dotenv from 'dotenv';
import connectDB from './db/index.js';
dotenv.config({
    path: './env'
})


connectDB();



// import mongoose from "mongoose";
// import express from 'express'
// import { DB_NAME } from "./constants.js";


// const app = express();

// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)

//         app.listen(process.env.PORT, () => {
//             console.log("app is listening on ", process.env.PORT);
//         })

//     } catch (error) {
//         console.error(error)
//     }
// })()