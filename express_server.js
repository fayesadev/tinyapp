const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const generateRandomString = function() {
  let result = '';
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const strLength = 6;
  for (let i = 0; i < strLength; i++) {
    result += char.charAt(Math.floor(Math.random()*char.length));
  }
  return result;
}
//helper function to go through users object
const findUserByEmail = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
}

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
/// HOME PAGE ///
app.get("/", (req, res) => {
  res.redirect("/urls");
});

/// LOGIN FORM ///
app.post("/login", (req, res) => {
  const user = findUserByEmail(req.body["email"]);
  if (!user) {
    res.status(403).send("Unable to find Email");
  }
  if (req.body["password"] !== user.password) {
    res.status(403).send("Invalid Password");
  }
  res.cookie("user_id", user.id)
  res.redirect("/urls");
});
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  const userID = req.cookies["user_id"]; 
  const user = users[userID]; 
  const templateVars =  { user: user };
  res.render("login", templateVars);
})

/// LOGOUT ENDPOINT ///
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

/// REGISTRATION PAGE ///
app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"]; 
  const user = users[userID]; 
  const templateVars = { email: req.body["email"], password: req.body["password"], user: user };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const newEmail = req.body["email"];
  const newPass = req.body["password"];
  // console.log("users {}", users);
  // console.log("findUser(user@example.com", findUserByEmail(newEmail));
  if (newEmail === "" || newPass === "") {
    res.status(400).send("Invalid email or password");
  }
  if (findUserByEmail(newEmail)) {
    res.status(400).send("Email already exists!");
  }
  const userID = generateRandomString();
  res.cookie("user_id", userID);
  users[userID] = { id: userID,
                    email: req.body["email"],
                    password: req.body["password"] };
  // console.log("users[userID]", users[userID]);
  // console.log("users", users);
  res.redirect("/urls");
});

/// MY URLS PAGE ///
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"]; // check if userID exists
  const user = users[userID]; //if user doesn't exist redirect to register
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

/// CREATE NEW URL PAGE ///
app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"]; 
  const user = users[userID]; 
  const templateVars =  { user: user };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${id}`); // Redirect to new shortURL page
});

/// URL ID PAGE ///
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"]; 
  const user = users[userID]; 
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: user};
  res.render("urls_show", templateVars);
});

// Delete an existing URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
});

// Redirect to long URL
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