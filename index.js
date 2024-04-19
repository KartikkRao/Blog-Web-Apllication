import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
env.config();
// PostgreSQL database connection setup
const db = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});


// Session store setup using connect-pg-simple with PostgreSQL
const app = express();
const port = 3000;
const saltRounds = 10;
const API_URL = "http://localhost:4000";


app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 day cookies life
        },
    })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());


// Passport Local Strategy for user authentication
passport.use(
    new Strategy(async (username, password, done) => {
        try {
            const result = await db.query("SELECT * FROM customer WHERE username = $1", [username]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedHashedPassword = user.password;
                bcrypt.compare(password, storedHashedPassword, (err, isValid) => {
                    if (err) {
                        return done(err);
                    }
                    if (isValid) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                });
            } else {
                return done(null, false);
            }
        } catch (err) {
            return done(err);
        }
    })
);

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  
  db.connect();

// Route to render login page
app.get("/", (req, res) => {
    res.render("login.ejs");
});

// Route to render signup page
app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

// Route to handle logout
app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

//Home tab
app.get("/start",(req,res)=>{
    res.redirect("/log");
    
});

app.get("/log", (req, res) => {
    
  if (req.isAuthenticated()) {
    res.render("starting.ejs",{name:req.user.fname});
  } else {
      res.redirect("/");
  }
});


// Route to handle login
app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/log",
      failureRedirect: "/",
    })
  );


// Route to handle signup
app.post("/signup", async (req, res) => {
    const { fname, lname, email, username, password } = req.body;
    try {
        const checkResult = await db.query("SELECT * FROM customer WHERE username = $1", [username]);
        if (checkResult.rows.length > 0) {
            res.render("signup.ejs",{message:"Username or email already exists"});
        } else {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const result = await db.query("INSERT INTO customer (fname, lname, email, username, password) VALUES ($1, $2, $3, $4, $5) RETURNING *", [fname, lname, email, username, hashedPassword]);
            const user = result.rows[0];
            req.login(user, (err) => {
                console.log("success");
                res.redirect("/log");
              });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}); // Athentication finished

// start to blog 

// create blog upload page
app.get("/blogs",(req,res)=>{
    if (req.isAuthenticated()) {
        res.render("blog.ejs");
      } else {
          res.redirect("/");
      }
});

//view my blog
app.get("/myblog",async(req,res)=>{
    if (req.isAuthenticated()) {
        try{
            console.log(req.user);
    const result=await axios.post(`${API_URL}/myblog`,req.user);
            res.render("myblog.ejs",{datas: result.data.rows});
            console.log(result.data);
        }
        catch(error){}

    } 
    else {
        res.redirect("/log");
    }
});   

//view all blog link
app.get("/viewall",async(req,res)=>{
    if (req.isAuthenticated()) {
    try{
    const result=await axios.get(`${API_URL}/viewall`);
    res.render("allblog.ejs",{datas: result.data.rows});
            console.log(result.data);
    }
    catch(error)
    {
        res.redirect("/log");
    }
    }
    else{
        res.redirect("/");
    }
});

//view each own blog
app.get("/myblog/:id",async(req,res)=>{
    if (req.isAuthenticated()) {
    try {
        const blogid=req.params.id;
        console.log(blogid);
        const response = await axios.get(`${API_URL}/blog1`, {
            params: {
                blogid: blogid
            }
        });
        res.render("viewblog.ejs",{data:response.data.rows[0]});
    } catch (error) {
        console.error('Error:', error.response.data);
    }
}
else{
    res.redirect("/");
}

});

// all blog
app.get("/allblog/:id",async(req,res)=>{
    if (req.isAuthenticated()) {
    try {
        const blogid=req.params.id;
        console.log(blogid);
        const response = await axios.get(`${API_URL}/blog1`, {
            params: {
                blogid: blogid
            }
        });
        res.render("viewblog1.ejs",{data:response.data.rows[0]});
    } catch (error) {
        console.error('Error:', error.response.data);
    }
}
else{
    res.redirect("/");
}

});

//update page
app.get("/updateBlog/:id",async(req,res)=>{
    if (req.isAuthenticated()) {
    try {
        const blogid=req.params.id;
        console.log(blogid);
        const response = await axios.get(`${API_URL}/blog1`, {
            params: {
                blogid: blogid
            }
        });
        res.render("blogpatch.ejs",{data:response.data.rows[0]});
    } catch (error) {
        console.error('Error:', error.response.data);
        res.send("<h1> Cannot update error occured </h1>");
    }
}
else{
    res.redirect("/");
}
})


// update blog
app.post("/patch",async(req,res)=>{
    if (req.isAuthenticated()) {
    try{
        console.log(req.body);
    const result=await axios.patch(`${API_URL}/patch`,req.body);
    res.redirect("/myblog");
    }
    catch(error){
        console.error(error);
       
    }
}
else
{
    res.redirect("/");
}
});

//post a blog
app.post("/blogs", async(req,res)=>{
    try{
        console.log(req.user);
        const Body={
            data: req.body,
            user: req.user
        }
    const result=await axios.post(`${API_URL}/blogs`,Body);
    if(result && result.status===202){
    console.log("Request to API server successful");
    res.redirect("/log");
    }
    else{
        throw new Error("Api request Failed");
    }
    }
    catch (error){
        console.error(error);
        res.redirect("/blogs");
    }
});


//delete system 

app.get("/deleteblog/:id",async(req,res)=>{
   try{
    const blogid=req.params.id;
    res.render("delete.ejs",{data:blogid});
   }
   catch(error){
    console.error(error);
    res.send("<h1> Cannot delete error occured </h1>");
   }
});

app.post("/delete",async(req,res)=>{
    try{
        if(req.body.yes){
            try{
            const reesult=await axios.delete(`${API_URL}/deleteblog`,{
                params: {
                    blogid: req.body.blogid
                }
                })
                res.redirect("/myblog");
            }
            catch(error)
            {
                res.send("<h1> some eroor occured while deleting </h1>");
            }
        }
        else if(req.body.no){
            res.redirect("/myblog");
        }
        else{
            res.send("<h1> some eroor </h1>");
        }
    }
    catch(error){
        console.error(error);
        res.send("<h1> some eroor occured while deleting </h1>");
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
  





