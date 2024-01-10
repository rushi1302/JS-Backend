import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
const app = express();

// to avoide cors error
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// when we get data from request in form of json
app.use(express.json({ limit: "16kb" }))
// when we want data from url
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
// when data as a file or pdf or image
app.use(express.static("public"))  // public is folder name
// to access cookie data
app.use(cookieParser())

// import routes
import userRouter from './routes/user.route.js'

app.use("/api/v1/user", userRouter)


export { app }