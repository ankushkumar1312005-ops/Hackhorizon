
const express = require("express");
const cors = require("cors");

const mysql = require("mysql");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@Nish@1010",
  database: "MeetSphere"
});

db.connect((err)=>{
  if(err){
    console.log(err);
  }else{
    console.log("MySQL Connected");
  }
});

app.get("/", (req,res)=>{
  res.send("MeetSphere Server Running");
});
app.post("/signup", async (req, res) => {

  const { name, email, password } = req.body;

  const checkEmail = "SELECT * FROM users WHERE email=?";

  db.query(checkEmail, [email], async (err, result) => {

    if (result.length > 0) {
      return res.send("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name,email,password) VALUES (?,?,?)";

    db.query(sql, [name, email, hashedPassword], (err, result) => {

      if (err) return res.send(err);

      res.send("User Registered Successfully");

    });

  });

});
app.listen(3000, ()=>{
  console.log("Server running on port 3000");
});
function authenticateToken(req, res, next) {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.send("Access Denied");
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {

    if (err) {
      return res.send("Invalid Token");
    }

    req.user = user;
    next();

  });

}
app.post("/login", (req, res) => {

  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email=?";

  db.query(sql, [email], async (err, result) => {

    if (err) {
      return res.send(err);
    }
    if  (result.length === 0) {
      return res.send("User not found");
    }

    const user = result[0];

    const match = await 
    bcrypt.compare(password, user.password);

    if (match) {
      const token = jwt.sign(
        { id: user.id, email: user.email },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Login Successful",
        token: token
      });
    } else {
      res.send("Invalid Password");
    }

  });

});
app.get("/profile", authenticateToken, (req, res) => {

  res.send({
    message: "Profile Access Granted",
    user: req.user
  });

});
app.put("/update-profile", authenticateToken, (req, res) => {

  const { name } = req.body;

  const sql = "UPDATE users SET name=? WHERE id=?";

  db.query(sql, [name, req.user.id], (err, result) => {

    if (err) {
      return res.send("Error updating profile");
    }

    res.send("Profile Updated Successfully");

  });

});
app.put("/change-password", authenticateToken, async (req, res) => {

  const { oldPassword, newPassword } = req.body;

  const sql = "SELECT password FROM users WHERE id=?";

  db.query(sql, [req.user.id], async (err, result) => {

    if (err) {
      return res.send("Database error");
    }

    if (result.length === 0) {
      return res.send("User not found");
    }

    const match = await
  bcrypt.compare(oldPassword,
  result[0].password);

    if (!match) {
      return res.send("Old password incorrect");
    }

    const hashedPassword = await 
  bcrypt.hash(newPassword, 10);

    const updateSql = "UPDATE users SET password=? WHERE id=?";

    db.query(updateSql, [hashedPassword, req.user.id], (err) => {

      if (err) {
        return res.send("Error updating password");
      }

      res.send("Password changed successfully");

    });

  });

});
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "MeetSphereSecret";
app.get("/users", authenticateToken, (req, res) => {

  const sql = "SELECT id, name, email FROM users";

  db.query(sql, (err, result) => {

    if (err) {
      return res.send("Error fetching users");
    }

    res.json(result);

  });

});
app.delete("/delete-account", authenticateToken, (req, res) => {

  const sql = "DELETE FROM users WHERE id=?";

  db.query(sql, [req.user.id], (err, result) => {

    if (err) {
      return res.send("Error deleting account");
    }

    res.send("Account deleted successfully");

  });

});
app.post("/add-event", authenticateToken, (req, res) => {

  const {
    event_name,
    category,
    description,
    location,
    event_date,
    event_time,
    organiser
  } = req.body;

  const sql = `
    INSERT INTO events 
    (event_name, category, description, location, event_date, event_time, organiser, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [event_name, category, description, location, event_date, event_time, organiser,req.user.id],
    (err, result) => {

      if (err) {
        return res.send("Error adding event");
      }

      res.send("Event created successfully");

    }
  );

});
app.get("/events", (req, res) => {

  const sql = "SELECT * FROM events";

  db.query(sql, (err, result) => {

    if (err) {
      return res.send("Error fetching events");
    }

    res.json(result);

  });

});
app.get("/my-events", authenticateToken, (req, res) => {

  const sql = "SELECT * FROM events WHERE user_id=?";

  db.query(sql, [req.user.id], (err, result) => {

    if (err) {
      return res.send("Error fetching your events");
    }

    res.json(result);

  });

});
