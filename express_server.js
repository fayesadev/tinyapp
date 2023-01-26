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
//helper function to go through urlDatabase
const findIdByUser = function(user) {
  const urls = {};
  for (let id in urlDatabase) {
    if (id.userID === user.id) {
      urls[id] = urlDatabase[id].longURL
    }
  }
  return urls;
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
  user3RandomID: {
    id: "user3RandomID",
    email: "a@a.com",
    password: "123"
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID",
  },
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
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
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
  if (!req.cookies["user_id"]) {
    res.status(403).send("Please login to use Tinyapp")
    // res.redirect("/login");
  }
  const userID = req.cookies["user_id"]; // check if userID exists
  const user = users[userID]; //if user doesn't exist redirect to register
  const urls = findIdByUser(userID);
  // console.log(urls);
  const templateVars = { urls: urls, user: user };
  res.render("urls_index", templateVars);
});

/// CREATE NEW URL PAGE ///
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }
  const userID = req.cookies["user_id"]; 
  const user = users[userID]; 
  const templateVars =  { user: user };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("Please login to use Tinyapp");
  }
  // console.log(req.body.longURL); // Log the POST request body to the console
  const id = generateRandomString();
  console.log("urlDatabase[id]", urlDatabase[id]);
  urlDatabase[id] = { longURL: req.body.longURL,
                      userID: req.cookies["user_id"],};
  res.redirect(`/urls/${id}`); // Redirect to new shortURL page
});

/// URL ID PAGE ///
app.post("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("Please login to use Tinyapp");
  }
  urlDatabase[req.params.id] = { longURL: req.body.longURL,
                                 userID: req.cookies["user_id"]};
  res.redirect(`/urls`);
});

app.get("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }
  const userID = req.cookies["user_id"]; 
  const user = users[userID]; 
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: user};
  res.render("urls_show", templateVars);
});

// Delete an existing URL
app.post("/urls/:id/delete", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("Please login to use Tinyapp");
  }
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
});

// Redirect to long URL
app.get("/u/:id", (req, res) => {
  if (!(req.params.id in urlDatabase)) {
    res.status(404).send("URL does not exist")
  }
  const longURL = urlDatabase[req.params.id].longURL;
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