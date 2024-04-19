import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 4000;

env.config();

// PostgreSQL database connection setup
const db = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


app.use(bodyParser.json());

db.connect();

//view a blog
app.get("/blog1",async(req,res)=>{
  try{
  const blogid=req.query.blogid;
  console.log(req.query.blogid);
  const result=await db.query("select * from blogs where blogid=($1)",[blogid]);
  console.log(result);
  res.json(result);
  }
  catch(error){
    console.error(error);
    res.status(500).json(error);
  }
}); 

// view all blog
app.get("/viewall",async(req,res)=>{
  try{
    const result=await db.query("select fname,lname,blogid,customerid,title,blogdate,blog from customer inner join blogs on customer.id=blogs.customerid");
    console.log(result);
    res.json(result);
  }
  catch(error){
    console.error(error);
    res.status(500).json(error);
  }
});

// view my blog
app.post("/myblog",async(req,res)=>{
  try{
    console.log(req.body);
    const result=await db.query("select * from blogs where customerid=($1)",[req.body.id]);
    console.log(result);
    res.json(result);
  }
  catch(error){
    console.error(error);
    res.status(500).json(error);
  }
});

// posting a blog
app.post("/blogs", async (req, res) => {
    try {

        console.log(req.body);
      await db.query("INSERT INTO blogs (customerid, title, blogdate, blog) VALUES ($1, $2, $3, $4)",
        [req.body.user.id, req.body.data.title, req.body.data.date, req.body.data.blog]);
  
      console.log("Data inserted into database successfully");
      res.status(202).json("Query executed successfully");
    } catch (error) {
      console.error("Error inserting data into database:", error);
      res.status(500).json(error); // Use appropriate status code for database error
    }
  }); 

  //update blog
  app.patch("/patch",async(req,res)=>{
    try{
    console.log(req.body);
    console.log("HELLO THIS HAS PRINTEDDDDDDDDDD");
    db.query("update blogs set title=($1),blogdate=($2),blog=($3) where blogid=($4)",[req.body.title,req.body.date,req.body.blog,req.body.blogid])
    res.status(202).json("Succesfull");
    }
    catch (error) {
      console.error("Error inserting data into database:", error);
      res.status(500).json(error); // Use appropriate status code for database error
    }
  });
//delete blog
  app.delete("/deleteblog",(req,res)=>{
    try{
    const blogid=req.query.blogid;
    db.query("delete from blogs where blogid=($1)",[blogid]);
    res.status(202).json("Succesfull");
    }
    catch (error) {
      console.error("Error inserting data into database:", error);
      res.status(500).json(error); // Use appropriate status code for database error
    }
  });

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});