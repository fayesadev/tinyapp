const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

function generateRandomString() {
  let result = '';
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const strLength = 6;
  for (let i = 0; i < strLength; i++) {
    result += char.charAt(Math.floor(Math.random()*char.length));
  }
  return result;
}

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//HOME PAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});

//Log In Cookie
app.post("/login", (req, res) => {
  res.cookie("user_id", req.body[user_id]);
  res.redirect("/urls");
});

//Log Out Cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

//Registration Page
app.get("/register", (req, res) => {
  const templateVars = { email: req.body["email"], password: req.body["password"] };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  res.cookie("user_id", userID);
  // console.log("req.body", req.body);
  users[userID] = { id: userID,
                    email: req.body["email"],
                    password: req.body["password"] };
  // console.log("users[userID]", users[userID]);
  // console.log("users", users);
  res.redirect("/urls");
});

//Urls page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars =  { user: users }
  res.render("urls_new", templateVars);
});

//Create a new URL
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${id}`); // Redirect to new shortURL page
});

//Delete an existing URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
});

//Edit a URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users};
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});