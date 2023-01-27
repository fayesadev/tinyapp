const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('tiny'));
app.set("view engine", "ejs");

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
  "sgq3y6": {
    longURL: "http://www.google.com",
    userID: "userRandomID",
  },
};
///  HELPER FUNCTIONS ///
const generateRandomString = function() {
  let result = '';
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const strLength = 6;
  for (let i = 0; i < strLength; i++) {
    result += char.charAt(Math.floor(Math.random()*char.length));
  }
  return result;
}
const findUserByEmail = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
}
const urlsForUser = function(id) {
  const urls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key].longURL;
    }
  }
  return urls;
}
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
  if (bcrypt.compareSync(user.password !== req.body["password"])) {
    res.status(403).send("Invalid Password");
  }
  res.cookie("user_id", user.id)
  res.redirect("/urls");
});
app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"]; 
  if (userID) {
    res.redirect("/urls");
  }
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
  const templateVars = { email: req.body["email"], user: user };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const newEmail = req.body["email"];
  const newPass = req.body["password"];
  if (newEmail === "" || newPass === "") {
    res.status(400).send("Invalid email or password");
  }
  if (findUserByEmail(newEmail)) {
    res.status(400).send("Email already exists!");
  }
  const userID = generateRandomString();
  bcrypt.genSalt(10)
    .then((salt) => {
      return bcrypt.hash(newPass, salt);
    })
    .then((hash) => {
      // console.log("hash", hash);
      users[userID] = { id: userID,
                        email: newEmail,
                        password: hash }
      res.cookie("user_id", userID);
      res.redirect("/urls");
    })
});

/// MY URLS PAGE ///
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"]; // check if userID exists
  if (!userID) {
    res.status(403).send("Please login to use Tinyapp")
    // res.redirect("/login");
  }
  console.log("users /urls", users);
  const user = users[userID]; //if user doesn't exist redirect to register
  const urls = urlsForUser(userID);
  // console.log("user",user);
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
  urlDatabase[id] = { longURL: req.body.longURL,
                      userID: req.cookies["user_id"],};
    // console.log("urlDatabase", urlDatabase);
  res.redirect(`/urls/${id}`); // Redirect to new shortURL page
});

//////// URL ID PAGE ////////
/// SHOW URL ID ///
app.get("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"]; 
  if (!userID) {
    res.status(403).send("Please login to use Tinyapp");
  }
  if (!(req.params.id in urlDatabase)) {
    res.status(404).send("URL does not exist")
  }
  if (userID !== urlDatabase[req.params.id].userID) {
    res.status(403).send("Hey this is someone else's URL!")
  }
  const user = users[userID]; 
  const longURL = urlDatabase[req.params.id].longURL;
  const templateVars = { id: req.params.id, longURL: longURL, user: user};
  res.render("urls_show", templateVars);
});

/// EDIT URL ID ///
app.post("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("Please login to use Tinyapp");
  }
  if (!(req.params.id in urlDatabase)) {
    res.status(404).send("URL does not exist")
  }
  if (req.cookies["user_id"] !== urlDatabase[req.params.id].userID) {
    res.status(403).send("Hey this is someone else's URL!")
  }
  urlDatabase[req.params.id] = { longURL: req.body.longURL,
                                 userID: req.cookies["user_id"]};
  res.redirect(`/urls`);
});

/// DELETE URL ID ///
app.post("/urls/:id/delete", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("Please login to use Tinyapp");
  }
  //edge case if url id doesnt exist
  if (!(req.params.id in urlDatabase)) {
    res.status(404).send("URL does not exist")
  }
  if (req.cookies["user_id"] !== urlDatabase[req.params.id].userID) {
    res.status(403).send("Hey this is someone else's URL!")
  }
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
});

/// LONG URL REDIRECT ///
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

/// HANDLING ANY INVALID URL REQUEST ///
app.get('*', (req, res) => {
  res.status(404).redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});