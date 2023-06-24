const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const bodyParser = require("body-parser");

app.use(express.json());

const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API  1
app.post("/register", async (request, response) => {
  console.log("app");
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;

  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status = 200;
    const length = `${password}`.length;
    if (length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const addUserQuery = `INSERT INTO user (username, name, password, gender, location)
            VALUES (
               '${username}',
                '${name}',
               '${hashedPassword}',
               '${gender}',
                '${location}'

            )
            `;
      await db.run(addUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

//API 2
app.post("/login", async (request, response) => {
  const userDetails = request.body;
  const { username, password } = userDetails;
  const selectUSerQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const getUser = await db.get(selectUSerQuery);
  if (getUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, getUser.password);
    if (isPasswordMatched) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const userDetails = request.body;
  const { username, oldPassword, newPassword } = userDetails;
  const selectUSerQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const getUser = await db.get(selectUSerQuery);

  const isPasswordMatched = await bcrypt.compare(oldPassword, getUser.password);
  console.log(isPasswordMatched);
  if (isPasswordMatched === true) {
    const length = newPassword.length;
    console.log(length);
    if (length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(request.body.newPassword, 10);
      const updatePasswordQuery = `UPDATE user
            SET password = '${hashedNewPassword}' WHERE username = '${username}' ;`;
      await db.run(updatePasswordQuery);
      response.status = 200;
      response.send("Password updated");
    }
  } else {
    response.status = 400;
    response.send("Invalid current password");
  }
});

module.exports = app;
