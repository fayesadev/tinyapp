const express = require("express");
const cookieSession = require("cookie-session");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const { getUserByEmail, generateRandomString, urlsForUser } = require("./helpers");
const { users, urlDatabase } = require("./database");

const app = express();
const PORT = 8080;

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));
app.use(morgan('tiny'));
app.set("view engine", "ejs");

/// HOME PAGE ///
app.get("/", (req, res) => {
  res.redirect("/urls");
});

/// LOGIN FORM ///
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (!user) {
    return res.status(403).send("Uh oh! Seems like we don't have you registered.");
  } //Compare hashed password with user's password input
  if (!bcrypt.compareSync(req.body.password, user.hashedPassword)) {
    return res.status(403).send("Email and password do not match.");
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    return res.redirect("/urls");
  }
  const user = users[userID];
  const templateVars =  { user: user };
  res.render("login", templateVars);
});

/// LOGOUT ENDPOINT ///
app.post("/logout", (req, res) => {
  // req.session["user_id"] = null;
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("/login");
});

/// REGISTRATION PAGE ///
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    return res.redirect("/urls");
  }
  const user = users[userID];
  const templateVars = { email: req.body.email, user: user };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPass = req.body.password;
  if (!newEmail || !newPass) {
    return res.status(400).send("Invalid email or password.");
  }
  if (getUserByEmail(newEmail, users)) {
    return res.status(400).send("Email already exists!");
  }
  const userID = generateRandomString();
  // Store user's passwords as a hashed password using bcrypt
  // bcrypt.genSalt(10)
  //   .then((salt) => {
  //     console.log("salt", salt)
  //     return bcrypt.hashSync(newPass, salt);
  //   })
  //   .then((hash) => {
  //     console.log("hash", hash)
  //     users[userID] = { id: userID, email: newEmail, hashedPassword: hash };
  //     req.session.user_id = userID;
  //     res.redirect("/urls");
  //   });
  users[userID] = { id: userID, email: newEmail, hashedPassword: bcrypt.hash(newPass, 10) };
  req.session["user_id"] = userID;
  res.redirect("/urls");
});

/// MY URLS PAGE ///
app.get("/urls", (req, res) => {
  const userID = req.session.user_id; 
  //Check if user is logged in via user ID cookie
  if (!userID) {
    return res.status(403).send("Please login to use TinyApp.");
  }
  const user = users[userID];
  const urls = urlsForUser(userID, urlDatabase);
  const templateVars = { urls: urls, user: user };
  res.render("urls_index", templateVars);
});

/// CREATE NEW URL PAGE ///
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/login");
  }
  const user = users[userID];
  const templateVars =  { user: user };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(403).send("Please login to use TinyApp.");
  }
  if (req.body.longURL === "") {
    return res.status(400).send("Can't shorten something that's empty!");
  }
  const id = generateRandomString();
  urlDatabase[id] = { longURL: req.body.longURL, userID: userID };
  res.redirect(`/urls/${id}`);
});

//////// URL ID PAGE ////////
/// SHOW URL ID ///
app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const id = req.params.id;
  if (!userID) {
    return res.status(403).send("Please login to use TinyApp.");
  }
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL does not exist!");
  }
  if (userID !== urlDatabase[id].userID) {
    return res.status(403).send("Hey this is someone else's URL!");
  }
  const user = users[userID];
  const longURL = urlDatabase[id].longURL;
  const templateVars = { id: id, longURL: longURL, user: user };
  res.render("urls_show", templateVars);
});

/// EDIT URL ID ///
app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const id = req.params.id;
  if (!userID) {
    return res.status(403).send("Please login to use TinyApp.");
  }
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL does not exist!");
  }
  if (userID !== urlDatabase[id].userID) {
    return res.status(403).send("Hey this is someone else's URL!");
  }
  if (req.body.longURL === "") {
    return res.status(400).send("Can't shorten something that's empty!");
  }
  urlDatabase[id] = { longURL: req.body.longURL, userID: userID };
  res.redirect(`/urls`);
});

/// DELETE URL ID ///
app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  const id = req.params.id;
  if (!userID) {
    return res.status(403).send("Please login to use TinyApp.");
  }
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL does not exist!");
  }
  if (userID !== urlDatabase[id].userID) {
    return res.status(403).send("Hey this is someone else's URL!");
  }
  delete urlDatabase[id];
  res.redirect("/urls");
});

/// LONG URL REDIRECT ///
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL does not exist!");
  }
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/// HANDLING ANY INVALID URL REQUEST ///
app.get('*', (req, res) => {
  res.status(404).redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});